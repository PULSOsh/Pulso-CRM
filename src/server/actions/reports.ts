"use server";

import { and, count, eq, gte, inArray, lt, notInArray, sql, sum } from "drizzle-orm";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  approvals,
  companies,
  expenseCategories,
  financialTransactions,
  installments,
  opportunities,
  payableInstallments,
  payables,
  projects,
  receivables,
  tasks,
  users,
} from "../db/schema";
import { toCsv } from "../services/csv";

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

/** CRM-F3-10: saldo atual = soma de todas as linhas do razão (entradas -
 * saídas, histórico). Projeção = saldo atual + o que ainda está para entrar
 * (parcelas de recebível abertas) - o que ainda está para saír (parcelas de
 * pagável abertas), por mês de vencimento. */
export async function getCashFlowReport(monthsAhead = 3) {
  const { organizationId } = await requirePermission("reports.finance");

  const [balanceRow, inflowByMonth, outflowByMonth] = await Promise.all([
    db
      .select({
        balance: sql<string>`coalesce(sum(case when ${financialTransactions.direction} = 'in' then ${financialTransactions.amount} else -${financialTransactions.amount} end), 0)`,
      })
      .from(financialTransactions)
      .where(eq(financialTransactions.organizationId, organizationId)),

    db
      .select({
        month: sql<string>`to_char(${installments.dueDate}, 'YYYY-MM')`,
        total: sql<string>`coalesce(sum(${installments.amount} - coalesce(${installments.paidAmount}, 0)), 0)`,
      })
      .from(installments)
      .innerJoin(receivables, eq(receivables.id, installments.receivableId))
      .where(
        and(
          eq(receivables.organizationId, organizationId),
          notInArray(installments.status, ["paid", "cancelled"]),
        ),
      )
      .groupBy(sql`to_char(${installments.dueDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${installments.dueDate}, 'YYYY-MM')`),

    db
      .select({
        month: sql<string>`to_char(${payableInstallments.dueDate}, 'YYYY-MM')`,
        total: sql<string>`coalesce(sum(${payableInstallments.amount} - coalesce(${payableInstallments.paidAmount}, 0)), 0)`,
      })
      .from(payableInstallments)
      .innerJoin(payables, eq(payables.id, payableInstallments.payableId))
      .where(
        and(
          eq(payables.organizationId, organizationId),
          notInArray(payableInstallments.status, ["paid", "cancelled"]),
        ),
      )
      .groupBy(sql`to_char(${payableInstallments.dueDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${payableInstallments.dueDate}, 'YYYY-MM')`),
  ]);

  const currentBalance = Number(balanceRow[0]?.balance ?? 0);

  const now = new Date();
  const months = Array.from({ length: monthsAhead }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  let runningBalance = currentBalance;
  const byMonth = months.map((month) => {
    const inflow = Number(inflowByMonth.find((r) => r.month === month)?.total ?? 0);
    const outflow = Number(outflowByMonth.find((r) => r.month === month)?.total ?? 0);
    runningBalance += inflow - outflow;
    return { month, inflow, outflow, net: inflow - outflow, projectedBalance: runningBalance };
  });

  return { currentBalance, byMonth };
}

/** CRM-F3-11: DRE gerencial em regime de caixa, a partir do razão único
 * (financial_transactions) - só existe porque F3-05 passou a lançar toda
 * baixa de recebível/pagável ali. Estornos entram com direção invertida e
 * já netam automaticamente. */
export async function getDreReport(days: number) {
  const { organizationId } = await requirePermission("reports.finance");
  const since = daysAgo(days);

  const [revenueRow, expensesByCategory] = await Promise.all([
    db
      .select({
        total: sql<string>`coalesce(sum(case when ${financialTransactions.direction} = 'in' then ${financialTransactions.amount} else -${financialTransactions.amount} end), 0)`,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.organizationId, organizationId),
          eq(financialTransactions.kind, "receivable_payment"),
          gte(financialTransactions.occurredAt, since),
        ),
      ),

    db
      .select({
        categoryName: sql<string>`coalesce(${expenseCategories.name}, 'Sem categoria')`,
        total: sql<string>`coalesce(sum(case when ${financialTransactions.direction} = 'out' then ${financialTransactions.amount} else -${financialTransactions.amount} end), 0)`,
      })
      .from(financialTransactions)
      .leftJoin(expenseCategories, eq(expenseCategories.id, financialTransactions.categoryId))
      .where(
        and(
          eq(financialTransactions.organizationId, organizationId),
          eq(financialTransactions.kind, "payable_payment"),
          gte(financialTransactions.occurredAt, since),
        ),
      )
      .groupBy(expenseCategories.name),
  ]);

  const revenue = Number(revenueRow[0]?.total ?? 0);
  const totalExpenses = expensesByCategory.reduce((acc, row) => acc + Number(row.total), 0);

  return {
    revenue,
    expensesByCategory: expensesByCategory.map((row) => ({
      category: row.categoryName,
      total: Number(row.total),
    })),
    totalExpenses,
    result: revenue - totalExpenses,
  };
}

/** CRM-F3-12: inadimplência de clientes (recebíveis vencidos) - aging em
 * faixas e detalhamento por cliente. Calculado direto de due_date < now(),
 * sem depender de refreshOverdueInstallments já ter rodado. */
export async function getDelinquencyReport() {
  const { organizationId } = await requirePermission("reports.finance");
  const now = new Date();

  const overdueRows = await db
    .select({
      installmentId: installments.id,
      amount: installments.amount,
      paidAmount: installments.paidAmount,
      dueDate: installments.dueDate,
      companyId: receivables.companyId,
      companyName: sql<string>`coalesce(${companies.tradeName}, 'Sem cliente vinculado')`,
    })
    .from(installments)
    .innerJoin(receivables, eq(receivables.id, installments.receivableId))
    .leftJoin(companies, eq(companies.id, receivables.companyId))
    .where(
      and(
        eq(receivables.organizationId, organizationId),
        lt(installments.dueDate, now),
        notInArray(installments.status, ["paid", "cancelled"]),
      ),
    );

  const openRows = await db
    .select({
      total: sql<string>`coalesce(sum(${installments.amount} - coalesce(${installments.paidAmount}, 0)), 0)`,
    })
    .from(installments)
    .innerJoin(receivables, eq(receivables.id, installments.receivableId))
    .where(
      and(
        eq(receivables.organizationId, organizationId),
        notInArray(installments.status, ["paid", "cancelled"]),
      ),
    );

  const aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  const byCompany = new Map<string, { companyName: string; total: number; count: number }>();
  let totalOverdue = 0;

  for (const row of overdueRows) {
    const remaining = Number(row.amount) - Number(row.paidAmount ?? 0);
    const daysOverdue = Math.floor((now.getTime() - row.dueDate.getTime()) / (24 * 60 * 60 * 1000));
    totalOverdue += remaining;

    if (daysOverdue <= 30) aging["0-30"] += remaining;
    else if (daysOverdue <= 60) aging["31-60"] += remaining;
    else if (daysOverdue <= 90) aging["61-90"] += remaining;
    else aging["90+"] += remaining;

    const key = row.companyId ?? "sem-cliente";
    const existing = byCompany.get(key) ?? { companyName: row.companyName, total: 0, count: 0 };
    existing.total += remaining;
    existing.count += 1;
    byCompany.set(key, existing);
  }

  const totalOpen = Number(openRows[0]?.total ?? 0);

  return {
    totalOverdue,
    totalOpen,
    delinquencyRate: totalOpen > 0 ? totalOverdue / totalOpen : 0,
    aging,
    byCompany: Array.from(byCompany.values()).sort((a, b) => b.total - a.total),
  };
}

/** CRM-F5-09: exportação CSV dos relatórios fixos já existentes - reaproveita
 * a mesma permissão do relatório de origem, gera a string no servidor,
 * download é feito no cliente (Blob), sem armazenar arquivo nenhum. */
export async function exportCommercialReportCsv(days: number) {
  const report = await getCommercialReport(days);
  return toCsv(report.leadsByMonth.map((row) => ({ mes: row.month, total: row.total })));
}

export async function exportFinancialReportCsv(days: number) {
  const report = await getFinancialReport(days);
  return toCsv(
    report.byMonth.map((row) => ({
      mes: row.month,
      recebido: row.received,
      pendente: row.pending,
      vencido: row.overdue,
    })),
  );
}
