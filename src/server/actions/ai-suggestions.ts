"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { aiSuggestions, supportTickets, ticketComments } from "../db/schema";
import { callAnthropicMessages } from "../services/ai";
import { writeAuditLog } from "../services/audit-log";

type TicketSummarySuggestion = { summary: string; category: string };

/**
 * CRM-F5-08: só "resumo"/"classificação" (docs/PLANO_MESTRE_EVOLUCAO_CRM.md
 * §5 Módulo O) - lê o chamado e comentários já visíveis a quem tem
 * `tickets.read`/`ai.use`, nunca dado financeiro/pessoal. Grava a sugestão
 * como "pending" e para aqui - nunca aplica nada sozinha.
 */
export async function requestTicketSummarySuggestion(ticketId: string) {
  const { organizationId, userId } = await requirePermission("ai.use");

  const ticket = await db.query.supportTickets.findFirst({
    where: and(eq(supportTickets.id, ticketId), eq(supportTickets.organizationId, organizationId)),
  });
  if (!ticket) throw new Error("Chamado não encontrado.");

  const comments = await db.query.ticketComments.findMany({
    where: eq(ticketComments.ticketId, ticketId),
    orderBy: [asc(ticketComments.createdAt)],
  });

  const inputSummary = [
    `Assunto: ${ticket.subject}`,
    ticket.description ? `Descrição: ${ticket.description}` : null,
    ...comments.map((c) => `Comentário${c.isInternal ? " (interno)" : ""}: ${c.body}`),
  ]
    .filter((line): line is string => !!line)
    .join("\n");

  const prompt = `Você é um assistente de atendimento ao cliente. A partir do chamado abaixo, responda SOMENTE com um JSON no formato {"summary": string, "category": string}, sem nenhum texto fora do JSON. "summary" é um resumo objetivo em até 2 frases. "category" é uma palavra curta (ex.: "bug", "duvida", "financeiro", "acesso").\n\n${inputSummary}`;

  const raw = await callAnthropicMessages(prompt);
  let suggestion: TicketSummarySuggestion;
  try {
    const parsed = JSON.parse(raw);
    suggestion = {
      summary: typeof parsed.summary === "string" ? parsed.summary : raw.slice(0, 500),
      category: typeof parsed.category === "string" ? parsed.category : "indefinido",
    };
  } catch {
    suggestion = { summary: raw.slice(0, 500), category: "indefinido" };
  }

  const [row] = await db
    .insert(aiSuggestions)
    .values({
      organizationId,
      type: "ticket_summary",
      entityType: "ticket",
      entityId: ticketId,
      inputSummary,
      suggestion,
      requestedBy: userId,
    })
    .returning();

  revalidatePath("/crm/atendimento");
  return row;
}

export async function getAiSuggestionsForTicket(ticketId: string) {
  const { organizationId } = await requirePermission("ai.use");

  return db.query.aiSuggestions.findMany({
    where: and(
      eq(aiSuggestions.organizationId, organizationId),
      eq(aiSuggestions.entityType, "ticket"),
      eq(aiSuggestions.entityId, ticketId),
    ),
    orderBy: [desc(aiSuggestions.createdAt)],
  });
}

/** Confirmação humana explícita (gate da fase) - só aqui a sugestão vira
 * algo real, e mesmo assim só uma nota interna no chamado (nunca resposta
 * enviada ao cliente sozinha, nunca mudança de status/prioridade). */
export async function acceptAiSuggestion(id: string) {
  const { organizationId, userId } = await requirePermission("ai.use");

  const suggestion = await db.query.aiSuggestions.findFirst({
    where: and(eq(aiSuggestions.id, id), eq(aiSuggestions.organizationId, organizationId)),
  });
  if (!suggestion) throw new Error("Sugestão não encontrada.");
  if (suggestion.status !== "pending") throw new Error("Esta sugestão já foi decidida.");

  await db.transaction(async (tx) => {
    await tx
      .update(aiSuggestions)
      .set({ status: "accepted", decidedBy: userId, decidedAt: new Date() })
      .where(eq(aiSuggestions.id, id));

    if (suggestion.type === "ticket_summary") {
      const data = suggestion.suggestion as TicketSummarySuggestion;
      await tx.insert(ticketComments).values({
        ticketId: suggestion.entityId,
        authorUserId: userId,
        body: `[Resumo sugerido por IA, aceito] ${data.summary} (categoria: ${data.category})`,
        isInternal: true,
      });
    }

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "ai_suggestion.accepted",
        entityType: "ai_suggestion",
        entityId: id,
        after: { suggestion: suggestion.suggestion },
      },
      tx,
    );
  });

  revalidatePath("/crm/atendimento");
  return { success: true };
}

export async function rejectAiSuggestion(id: string) {
  const { organizationId, userId } = await requirePermission("ai.use");

  const suggestion = await db.query.aiSuggestions.findFirst({
    where: and(eq(aiSuggestions.id, id), eq(aiSuggestions.organizationId, organizationId)),
  });
  if (!suggestion) throw new Error("Sugestão não encontrada.");
  if (suggestion.status !== "pending") throw new Error("Esta sugestão já foi decidida.");

  await db.transaction(async (tx) => {
    await tx
      .update(aiSuggestions)
      .set({ status: "rejected", decidedBy: userId, decidedAt: new Date() })
      .where(eq(aiSuggestions.id, id));

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "ai_suggestion.rejected",
        entityType: "ai_suggestion",
        entityId: id,
      },
      tx,
    );
  });

  revalidatePath("/crm/atendimento");
  return { success: true };
}
