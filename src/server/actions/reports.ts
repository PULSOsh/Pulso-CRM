"use server";

import { and, count, eq, gte, inArray, sql, sum } from "drizzle-orm";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  approvals,
  installments,
  opportunities,
  projects,
  receivables,
  tasks,
  users,
} from "../db/schema";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** Regra do módulo (docs/MODULE_SPECIFICATIONS.md §14): agregação no banco,
 * nunca cálculo completo no cliente - por isso, diferente do dashboard
 * (Fase 5), aqui usamos group by/count/sum do SQL. */
export async function getCommercialReport(days: number) {
  const { organizationId } = await requirePermission("reports.read");
  const since = daysAgo(days);

  const [leadsByMonth, byOrigin, byOwner, avgTicketRow] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${opportunities.createdAt}, 'YYYY-MM')`,
        total: count(),
      })
      .from(opportunities)
      .where(
        and(eq(opportunities.organizationId, organizationId), gte(opportunities.createdAt, since)),
      )
      .groupBy(sql`to_char(${opportunities.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${opportunities.createdAt}, 'YYYY-MM')`),

    db
      .select({
        origin: sql<string>`coalesce(${opportunities.source}, 'Não informado')`,
        total: count(),
        won: sql<number>`count(*) filter (where ${opportunities.status} = 'won')`,
      })
      .from(opportunities)
      .where(
        and(eq(opportunities.organizationId, organizationId), gte(opportunities.createdAt, since)),
      )
      .groupBy(sql`coalesce(${opportunities.source}, 'Não informado')`),

    db
      .select({
        ownerName: sql<string>`coalesce(${users.name}, 'Sem responsável')`,
        won: sql<number>`count(*) filter (where ${opportunities.status} = 'won')`,
        lost: sql<number>`count(*) filter (where ${opportunities.status} = 'lost')`,
      })
      .from(opportunities)
      .leftJoin(users, eq(users.id, opportunities.ownerUserId))
      .where(
        and(
          eq(opportunities.organizationId, organizationId),
          inArray(opportunities.status, ["won", "lost"]),
          gte(opportunities.createdAt, since),
        ),
      )
      .groupBy(users.name),

    db
      .select({ avgTicket: sql<string>`avg(${opportunities.estimatedValue})` })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.organizationId, organizationId),
          eq(opportunities.status, "won"),
          gte(opportunities.createdAt, since),
        ),
      ),
  ]);

  return {
    leadsByMonth,
    byOrigin,
    byOwner,
    avgTicket: Number(avgTicketRow[0]?.avgTicket ?? 0),
  };
}

export async function getOperationalReport() {
  const { organizationId } = await requirePermission("reports.read");

  const [projectsByStatus, overdueTasksRow, pendingApprovalsRow] = await Promise.all([
    db
      .select({ status: projects.status, total: count() })
      .from(projects)
      .where(eq(projects.organizationId, organizationId))
      .groupBy(projects.status),

    db
      .select({ total: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, organizationId),
          eq(tasks.status, "todo"),
          sql`${tasks.dueAt} < now()`,
        ),
      ),

    db
      .select({ total: count() })
      .from(approvals)
      .where(and(eq(approvals.organizationId, organizationId), eq(approvals.status, "pending"))),
  ]);

  return {
    projectsByStatus,
    overdueTasks: overdueTasksRow[0]?.total ?? 0,
    pendingApprovals: pendingApprovalsRow[0]?.total ?? 0,
  };
}

export async function getFinancialReport(days: number) {
  const { organizationId } = await requirePermission("reports.finance");
  const since = daysAgo(days);

  const orgReceivableIds = db
    .select({ id: receivables.id })
    .from(receivables)
    .where(eq(receivables.organizationId, organizationId));

  const [byMonth, totalsRow] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${installments.dueDate}, 'YYYY-MM')`,
        received: sql<string>`coalesce(sum(${installments.paidAmount}) filter (where ${installments.status} = 'paid'), 0)`,
        pending: sql<string>`coalesce(sum(${installments.amount}) filter (where ${installments.status} in ('pending','due_soon')), 0)`,
        overdue: sql<string>`coalesce(sum(${installments.amount}) filter (where ${installments.status} = 'overdue'), 0)`,
      })
      .from(installments)
      .where(
        and(inArray(installments.receivableId, orgReceivableIds), gte(installments.dueDate, since)),
      )
      .groupBy(sql`to_char(${installments.dueDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${installments.dueDate}, 'YYYY-MM')`),

    db
      .select({
        totalReceivables: count(),
        totalAmount: sum(receivables.totalAmount),
      })
      .from(receivables)
      .where(eq(receivables.organizationId, organizationId)),
  ]);

  return {
    byMonth,
    totalReceivables: totalsRow[0]?.totalReceivables ?? 0,
    totalAmount: Number(totalsRow[0]?.totalAmount ?? 0),
  };
}
