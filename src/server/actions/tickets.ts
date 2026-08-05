"use server";

import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { companies, contacts, projects, supportTickets, ticketComments } from "../db/schema";
import { logActivity } from "../services/activity-log";
import { notifyUser } from "../services/notify";
import { enqueueOutboxEvent } from "../services/outbox";
import { calculateSlaDueAt } from "../services/sla";
import {
  addTicketCommentSchema,
  createPortalTicketSchema,
  createTicketSchema,
  updateTicketStatusSchema,
} from "./tickets.schemas";

const OPEN_STATUSES = ["open", "in_progress", "waiting_customer"] as const;

export async function createTicket(input: unknown) {
  const { organizationId, userId } = await requirePermission("tickets.manage");
  const parsed = createTicketSchema.parse(input);

  if (parsed.companyId) {
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, parsed.companyId), eq(companies.organizationId, organizationId)),
    });
    if (!company) throw new Error("Empresa não encontrada.");
  }
  if (parsed.contactId) {
    const contact = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, parsed.contactId), eq(contacts.organizationId, organizationId)),
    });
    if (!contact) throw new Error("Contato não encontrado.");
  }
  if (parsed.projectId) {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, parsed.projectId), eq(projects.organizationId, organizationId)),
    });
    if (!project) throw new Error("Projeto não encontrado.");
  }

  const priority = parsed.priority ?? "normal";
  const [ticket] = await db
    .insert(supportTickets)
    .values({
      organizationId,
      subject: parsed.subject,
      description: parsed.description || null,
      companyId: parsed.companyId || null,
      contactId: parsed.contactId || null,
      projectId: parsed.projectId || null,
      priority,
      slaDueAt: calculateSlaDueAt(priority),
      createdBy: userId,
    })
    .returning();

  await enqueueOutboxEvent({
    organizationId,
    eventType: "ticket_created",
    aggregateType: "ticket",
    aggregateId: ticket.id,
    payload: { subject: ticket.subject, priority: ticket.priority, companyId: ticket.companyId },
  });

  revalidatePath("/crm/atendimento");
  return ticket;
}

/** CRM-F5-03: aberto pelo cliente via /portal/[token] (F2-07), sem sessão -
 * mesmo padrão de submitSatisfaction/public-quote. `createdBy` fica nulo
 * (identifica quem abriu como "o cliente", não um usuário interno). */
export async function createPortalTicket(token: string, input: unknown) {
  if (!token) return { success: false as const, error: "Portal inválido." };
  const parsed = createPortalTicketSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Dados inválidos." };

  const project = await db.query.projects.findFirst({
    where: eq(projects.clientPortalToken, token),
  });
  if (!project?.clientPortalEnabled) return { success: false as const, error: "Portal inválido." };

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      organizationId: project.organizationId,
      subject: parsed.data.subject,
      description: parsed.data.description || null,
      companyId: project.companyId,
      projectId: project.id,
      priority: "normal",
      slaDueAt: calculateSlaDueAt("normal"),
    })
    .returning();

  if (project.ownerUserId) {
    await notifyUser({
      organizationId: project.organizationId,
      userId: project.ownerUserId,
      type: "ticket.created_from_portal",
      title: `Novo chamado: ${parsed.data.subject}`,
      actionUrl: "/crm/atendimento",
    });
  }

  await enqueueOutboxEvent({
    organizationId: project.organizationId,
    eventType: "ticket_created",
    aggregateType: "ticket",
    aggregateId: ticket.id,
    payload: { subject: ticket.subject, priority: ticket.priority, companyId: ticket.companyId },
  });

  return { success: true as const, ticketId: ticket.id };
}

/** Pública (CRM-F5-03) - lista os chamados do projeto no portal do cliente,
 * mesmo padrão de token de getClientPortalProject. Só o essencial (assunto/
 * status/data), sem comentários internos nem quem atendeu. */
export async function getClientPortalTickets(token: string) {
  if (!token) return [];

  const project = await db.query.projects.findFirst({
    where: eq(projects.clientPortalToken, token),
  });
  if (!project?.clientPortalEnabled) return [];

  return db.query.supportTickets.findMany({
    where: eq(supportTickets.projectId, project.id),
    orderBy: [desc(supportTickets.createdAt)],
    columns: { id: true, subject: true, status: true, priority: true, createdAt: true },
  });
}

export async function getTickets() {
  const { organizationId } = await requirePermission("tickets.read");

  const rows = await db.query.supportTickets.findMany({
    where: eq(supportTickets.organizationId, organizationId),
    orderBy: [desc(supportTickets.createdAt)],
  });

  const companyIds = rows.map((r) => r.companyId).filter((id): id is string => !!id);
  const assigneeIds = rows.map((r) => r.assignedTo).filter((id): id is string => !!id);

  const [ticketCompanies, assignees] = await Promise.all([
    companyIds.length > 0
      ? db.query.companies.findMany({
          where: (c, { inArray: inArrayOp }) => inArrayOp(c.id, companyIds),
        })
      : Promise.resolve([]),
    assigneeIds.length > 0
      ? db.query.users.findMany({
          where: (u, { inArray: inArrayOp }) => inArrayOp(u.id, assigneeIds),
        })
      : Promise.resolve([]),
  ]);

  return rows.map((r) => ({
    ...r,
    company: ticketCompanies.find((c) => c.id === r.companyId),
    assignee: assignees.find((u) => u.id === r.assignedTo),
  }));
}

export async function getTicket(id: string) {
  const { organizationId } = await requirePermission("tickets.read");

  const ticket = await db.query.supportTickets.findFirst({
    where: and(eq(supportTickets.id, id), eq(supportTickets.organizationId, organizationId)),
  });
  if (!ticket) throw new Error("Chamado não encontrado.");

  const comments = await db.query.ticketComments.findMany({
    where: eq(ticketComments.ticketId, id),
    orderBy: [asc(ticketComments.createdAt)],
  });

  return { ticket, comments };
}

export async function updateTicketStatus(id: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("tickets.manage");
  const parsed = updateTicketStatusSchema.parse(input);

  const ticket = await db.query.supportTickets.findFirst({
    where: and(eq(supportTickets.id, id), eq(supportTickets.organizationId, organizationId)),
  });
  if (!ticket) throw new Error("Chamado não encontrado.");

  await db.transaction(async (tx) => {
    await tx
      .update(supportTickets)
      .set({
        status: parsed.status,
        resolvedAt: parsed.status === "resolved" ? new Date() : ticket.resolvedAt,
        closedAt: parsed.status === "closed" ? new Date() : ticket.closedAt,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id));

    await logActivity(
      {
        organizationId,
        actorUserId: userId,
        type: "system",
        title: `Chamado "${ticket.subject}" movido para ${parsed.status}`,
      },
      tx,
    );
  });

  revalidatePath("/crm/atendimento");
  return { success: true };
}

export async function assignTicket(id: string, assigneeUserId: string | null) {
  const { organizationId } = await requirePermission("tickets.manage");

  const [updated] = await db
    .update(supportTickets)
    .set({ assignedTo: assigneeUserId, updatedAt: new Date() })
    .where(and(eq(supportTickets.id, id), eq(supportTickets.organizationId, organizationId)))
    .returning({ id: supportTickets.id });
  if (!updated) throw new Error("Chamado não encontrado.");

  if (assigneeUserId) {
    await notifyUser({
      organizationId,
      userId: assigneeUserId,
      type: "ticket.assigned",
      title: "Um chamado foi atribuído a você",
      actionUrl: "/crm/atendimento",
    });
  }

  revalidatePath("/crm/atendimento");
  return { success: true };
}

export async function addTicketComment(ticketId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("tickets.comment");
  const parsed = addTicketCommentSchema.parse(input);

  const ticket = await db.query.supportTickets.findFirst({
    where: and(eq(supportTickets.id, ticketId), eq(supportTickets.organizationId, organizationId)),
  });
  if (!ticket) throw new Error("Chamado não encontrado.");

  await db.insert(ticketComments).values({
    ticketId,
    authorUserId: userId,
    body: parsed.body,
    isInternal: parsed.isInternal ?? false,
  });

  revalidatePath("/crm/atendimento");
  return { success: true };
}

/** Sem job agendado (mesmo padrão de refreshOverdueInstallments/
 * refreshOverduePayableInstallments) - checagem sob demanda. */
export async function getOverdueTickets() {
  const { organizationId } = await requirePermission("tickets.read");

  return db.query.supportTickets.findMany({
    where: and(
      eq(supportTickets.organizationId, organizationId),
      lt(supportTickets.slaDueAt, new Date()),
      inArray(supportTickets.status, OPEN_STATUSES),
    ),
    orderBy: [asc(supportTickets.slaDueAt)],
  });
}
