"use server";

import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  automationRules,
  automationRuns,
  integrationConnections,
  outboxEvents,
  tasks,
} from "../db/schema";
import type { AutomationAction, AutomationCondition } from "../services/automation";
import { computeAutomationIdempotencyKey, evaluateConditions } from "../services/automation";
import { notifyUser } from "../services/notify";

const MAX_RUN_ATTEMPTS = 5;
const MAX_EVENT_ATTEMPTS = 5;
const BATCH_SIZE = 20;

type EventContext = Record<string, unknown> & { organizationId: string; aggregateId: string };

/** Só ações seguras/reversíveis (docs/PLANO_MESTRE_EVOLUCAO_CRM.md §5 Módulo
 * O) - nunca aprova, assina, exclui ou movimenta dinheiro. */
async function executeAutomationAction(
  action: AutomationAction,
  context: EventContext,
  organizationId: string,
) {
  switch (action.type) {
    case "create_notification": {
      const userId = action.params.userId;
      if (typeof userId !== "string")
        throw new Error("Ação create_notification sem userId configurado.");
      await notifyUser({
        organizationId,
        userId,
        type: "automation",
        title:
          typeof action.params.title === "string" ? action.params.title : "Automação executada",
        body: typeof action.params.body === "string" ? action.params.body : undefined,
        actionUrl:
          typeof action.params.actionUrl === "string" ? action.params.actionUrl : undefined,
      });
      return;
    }
    case "create_task": {
      await db.insert(tasks).values({
        organizationId,
        title:
          typeof action.params.title === "string"
            ? action.params.title
            : "Tarefa gerada por automação",
        description:
          typeof action.params.description === "string" ? action.params.description : undefined,
      });
      return;
    }
    case "send_webhook": {
      const connections = await db.query.integrationConnections.findMany({
        where: and(
          eq(integrationConnections.organizationId, organizationId),
          eq(integrationConnections.provider, "webhook"),
          eq(integrationConnections.status, "active"),
        ),
      });
      if (connections.length === 0) throw new Error("Nenhuma integração de webhook ativa.");

      for (const connection of connections) {
        const url = (connection.settings as { url?: string } | null)?.url;
        if (!url) continue;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: context }),
        });
        if (!response.ok) {
          throw new Error(`Webhook "${connection.name}" respondeu ${response.status}.`);
        }
      }
      return;
    }
  }
}

/**
 * CRM-F5-04/F5-05: núcleo do motor. Encontra regras ativas do gatilho,
 * avalia condições, executa ações - idempotente (unique em `ruleId` +
 * `idempotencyKey`: uma regra nunca roda duas vezes para o mesmo agregado).
 * Nunca lança - cada regra tem seu próprio try/catch e fica registrada em
 * `automation_runs`, sucesso ou falha, para o evento inteiro poder ser
 * marcado como processado mesmo se uma regra específica falhar.
 */
export async function runAutomationsForEvent(
  organizationId: string,
  triggerType: string,
  context: EventContext,
  eventId?: string,
) {
  const rules = await db.query.automationRules.findMany({
    where: and(
      eq(automationRules.organizationId, organizationId),
      eq(
        automationRules.triggerType,
        triggerType as (typeof automationRules.$inferSelect)["triggerType"],
      ),
      eq(automationRules.isActive, true),
    ),
  });

  for (const rule of rules) {
    const conditions = rule.conditions as AutomationCondition[];
    if (!evaluateConditions(conditions, context)) continue;

    const idempotencyKey = computeAutomationIdempotencyKey(context.aggregateId);

    const existing = await db.query.automationRuns.findFirst({
      where: and(
        eq(automationRuns.ruleId, rule.id),
        eq(automationRuns.idempotencyKey, idempotencyKey),
      ),
    });
    if (existing?.status === "success") continue;
    if (existing && existing.attempts >= MAX_RUN_ATTEMPTS) continue;

    const actions = rule.actions as AutomationAction[];
    try {
      for (const action of actions) {
        await executeAutomationAction(action, context, organizationId);
      }

      await db
        .insert(automationRuns)
        .values({
          ruleId: rule.id,
          organizationId,
          eventId,
          idempotencyKey,
          status: "success",
          attempts: 1,
          finishedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [automationRuns.ruleId, automationRuns.idempotencyKey],
          set: {
            status: "success",
            attempts: sql`${automationRuns.attempts} + 1`,
            lastError: null,
            finishedAt: new Date(),
          },
        });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const nextAttempts = (existing?.attempts ?? 0) + 1;
      const status = nextAttempts >= MAX_RUN_ATTEMPTS ? "dead_letter" : "failed";

      await db
        .insert(automationRuns)
        .values({
          ruleId: rule.id,
          organizationId,
          eventId,
          idempotencyKey,
          status,
          attempts: 1,
          lastError: message,
          finishedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [automationRuns.ruleId, automationRuns.idempotencyKey],
          set: {
            status,
            attempts: sql`${automationRuns.attempts} + 1`,
            lastError: message,
            finishedAt: new Date(),
          },
        });
    }
  }
}

/** CRM-F5-05: sem worker/job agendado neste ambiente (mesmo padrão "geração
 * manual" já usado em recorrências financeiras) - processa um lote de
 * eventos pendentes sob demanda. */
export async function processPendingAutomations() {
  const { organizationId } = await requirePermission("automation.run");

  const pending = await db.query.outboxEvents.findMany({
    where: and(
      eq(outboxEvents.organizationId, organizationId),
      isNull(outboxEvents.processedAt),
      lte(outboxEvents.availableAt, new Date()),
    ),
    orderBy: [outboxEvents.occurredAt],
    limit: BATCH_SIZE,
  });

  let processed = 0;
  for (const event of pending) {
    try {
      await runAutomationsForEvent(
        organizationId,
        event.eventType,
        {
          ...(event.payload as Record<string, unknown>),
          organizationId,
          aggregateId: event.aggregateId,
        },
        event.id,
      );
      await db
        .update(outboxEvents)
        .set({ processedAt: new Date() })
        .where(eq(outboxEvents.id, event.id));
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .update(outboxEvents)
        .set({ attempts: sql`${outboxEvents.attempts} + 1`, lastError: message })
        .where(eq(outboxEvents.id, event.id));
    }
  }

  revalidatePath("/crm/automacoes");
  return { processed, remaining: pending.length - processed };
}

export async function getAutomationQueueStatus() {
  const { organizationId } = await requirePermission("automation.read");

  const [pendingRow, deadLetterRow, recentRuns] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(outboxEvents)
      .where(
        and(
          eq(outboxEvents.organizationId, organizationId),
          isNull(outboxEvents.processedAt),
          gte(outboxEvents.attempts, 0),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(outboxEvents)
      .where(
        and(
          eq(outboxEvents.organizationId, organizationId),
          isNull(outboxEvents.processedAt),
          gte(outboxEvents.attempts, MAX_EVENT_ATTEMPTS),
        ),
      ),
    db.query.automationRuns.findMany({
      where: eq(automationRuns.organizationId, organizationId),
      orderBy: [desc(automationRuns.startedAt)],
      limit: 20,
    }),
  ]);

  return {
    pending: Number(pendingRow[0]?.count ?? 0),
    deadLetter: Number(deadLetterRow[0]?.count ?? 0),
    recentRuns,
  };
}
