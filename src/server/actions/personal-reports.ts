"use server";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../db/connection";
import {
  personalAccounts,
  personalCategories,
  personalCreditCards,
  personalDebts,
  personalGoals,
  personalRecurrences,
  personalTransactions,
} from "../db/schema";
import { requirePersonalAccess } from "../services/personal-workspace";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** CRM-F4-10: fluxo de caixa pessoal - totais mensais de entrada/saída dos
 * últimos N meses, direto de personal_transactions (sem projeção: aqui não
 * existe conceito de "parcela em aberto" separado do lançamento em si -
 * uma parcela futura já É um personal_transactions com occurredAt futuro). */
export async function getPersonalCashFlowReport(days = 180) {
  const { organizationId } = await requirePersonalAccess("read");
  const since = daysAgo(days);

  const rows = await db
    .select({
      month: sql<string>`to_char(${personalTransactions.occurredAt}, 'YYYY-MM')`,
      income: sql<string>`coalesce(sum(${personalTransactions.amount}) filter (where ${personalTransactions.kind} = 'income'), 0)`,
      expense: sql<string>`coalesce(sum(${personalTransactions.amount}) filter (where ${personalTransactions.kind} = 'expense'), 0)`,
    })
    .from(personalTransactions)
    .where(
      and(
        eq(personalTransactions.organizationId, organizationId),
        gte(personalTransactions.occurredAt, since),
      ),
    )
    .groupBy(sql`to_char(${personalTransactions.occurredAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${personalTransactions.occurredAt}, 'YYYY-MM')`);

  return rows.map((r) => ({
    month: r.month,
    income: Number(r.income),
    expense: Number(r.expense),
    net: Number(r.income) - Number(r.expense),
  }));
}

export async function getPersonalSpendingByCategory(days = 30) {
  const { organizationId } = await requirePersonalAccess("read");
  const since = daysAgo(days);

  const rows = await db
    .select({
      categoryName: sql<string>`coalesce(${personalCategories.name}, 'Sem categoria')`,
      total: sql<string>`coalesce(sum(${personalTransactions.amount}), 0)`,
    })
    .from(personalTransactions)
    .leftJoin(personalCategories, eq(personalCategories.id, personalTransactions.categoryId))
    .where(
      and(
        eq(personalTransactions.organizationId, organizationId),
        eq(personalTransactions.kind, "expense"),
        gte(personalTransactions.occurredAt, since),
      ),
    )
    .groupBy(personalCategories.name);

  return rows
    .map((r) => ({ category: r.categoryName, total: Number(r.total) }))
    .sort((a, b) => b.total - a.total);
}

/** CRM-F4-07: patrimônio = saldo das contas (soma de entradas menos saídas
 * desde sempre - sem saldo de abertura, débito conhecido) + metas - dívidas
 * em aberto. */
export async function getPersonalNetWorth() {
  const { organizationId } = await requirePersonalAccess("read");

  const [accounts, balanceRows, goals, debts] = await Promise.all([
    db.query.personalAccounts.findMany({
      where: and(
        eq(personalAccounts.organizationId, organizationId),
        eq(personalAccounts.isActive, true),
      ),
    }),
    db
      .select({
        accountId: personalTransactions.accountId,
        balance: sql<string>`coalesce(sum(case when ${personalTransactions.kind} in ('income','transfer_in') then ${personalTransactions.amount} else -${personalTransactions.amount} end), 0)`,
      })
      .from(personalTransactions)
      .where(eq(personalTransactions.organizationId, organizationId))
      .groupBy(personalTransactions.accountId),
    db.query.personalGoals.findMany({
      where: and(
        eq(personalGoals.organizationId, organizationId),
        eq(personalGoals.isActive, true),
      ),
    }),
    db.query.personalDebts.findMany({
      where: and(
        eq(personalDebts.organizationId, organizationId),
        eq(personalDebts.status, "open"),
      ),
    }),
  ]);

  const accountBalances = accounts.map((account) => ({
    accountId: account.id,
    name: account.name,
    balance: Number(balanceRows.find((r) => r.accountId === account.id)?.balance ?? 0),
  }));

  const totalAccounts = accountBalances.reduce((acc, a) => acc + a.balance, 0);
  const totalGoals = goals.reduce((acc, g) => acc + Number(g.currentAmount), 0);
  const totalDebts = debts.reduce((acc, d) => acc + Number(d.remainingAmount), 0);

  return {
    accountBalances,
    totalAccounts,
    totalGoals,
    totalDebts,
    netWorth: totalAccounts + totalGoals - totalDebts,
  };
}

/** CRM-F4-09: "calendário e alertas" pessoal como relatório de próximos
 * itens, deliberadamente NUNCA integrado ao calendário compartilhado de
 * tarefas/marcos (F2-03) - esse é visível a papéis de negócio, e dado
 * pessoal não pode aparecer lá mesmo indiretamente. */
export async function getPersonalUpcomingItems(daysAhead = 60) {
  const { organizationId } = await requirePersonalAccess("read");
  const now = new Date();
  const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const [futureTransactions, recurrences, cards] = await Promise.all([
    db.query.personalTransactions.findMany({
      where: and(
        eq(personalTransactions.organizationId, organizationId),
        gte(personalTransactions.occurredAt, now),
        lt(personalTransactions.occurredAt, until),
      ),
    }),
    db.query.personalRecurrences.findMany({
      where: and(
        eq(personalRecurrences.organizationId, organizationId),
        eq(personalRecurrences.isActive, true),
        gte(personalRecurrences.nextRunDate, now),
        lt(personalRecurrences.nextRunDate, until),
      ),
    }),
    db.query.personalCreditCards.findMany({
      where: and(
        eq(personalCreditCards.organizationId, organizationId),
        eq(personalCreditCards.isActive, true),
      ),
    }),
  ]);

  const items = [
    ...futureTransactions.map((t) => ({
      kind: "transaction" as const,
      date: t.occurredAt,
      description: t.description,
      amount: Number(t.amount),
    })),
    ...recurrences.map((r) => ({
      kind: "recurrence" as const,
      date: r.nextRunDate,
      description: `${r.description} (recorrência prevista)`,
      amount: Number(r.amount),
    })),
    ...cards
      .map((card) => {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), card.dueDay);
        if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
        return dueDate <= until
          ? {
              kind: "invoice" as const,
              date: dueDate,
              description: `Fatura ${card.name}`,
              amount: null,
            }
          : null;
      })
      .filter(
        (item): item is { kind: "invoice"; date: Date; description: string; amount: null } =>
          item !== null,
      ),
  ];

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}
