"use server";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { personalBudgets, personalCategories, personalTransactions } from "../db/schema";
import { requirePersonalAccess } from "../services/personal-workspace";
import { personalBudgetSchema } from "./personal-budgets.schemas";

function monthStart(value: string) {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function upsertPersonalBudget(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalBudgetSchema.parse(input);
  const month = monthStart(parsed.month);

  const [budget] = await db
    .insert(personalBudgets)
    .values({
      organizationId,
      month,
      categoryId: parsed.categoryId,
      plannedAmount: parsed.plannedAmount.toFixed(2),
    })
    .onConflictDoUpdate({
      target: [personalBudgets.organizationId, personalBudgets.month, personalBudgets.categoryId],
      set: { plannedAmount: parsed.plannedAmount.toFixed(2) },
    })
    .returning();

  revalidatePath("/crm/pessoal");
  return budget;
}

/** CRM-F4-06: planejado (personal_budgets) vs realizado (soma de
 * personal_transactions kind="expense" no mês), por categoria. Categorias
 * sem orçamento definido aparecem só no lado "realizado". */
export async function getPersonalBudgetReport(month: string) {
  const { organizationId } = await requirePersonalAccess("read");
  const start = monthStart(month);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  const [budgets, categories, actualRows] = await Promise.all([
    db.query.personalBudgets.findMany({
      where: and(
        eq(personalBudgets.organizationId, organizationId),
        eq(personalBudgets.month, start),
      ),
    }),
    db.query.personalCategories.findMany({
      where: and(
        eq(personalCategories.organizationId, organizationId),
        eq(personalCategories.kind, "expense"),
      ),
    }),
    db
      .select({
        categoryId: personalTransactions.categoryId,
        total: sql<string>`coalesce(sum(${personalTransactions.amount}), 0)`,
      })
      .from(personalTransactions)
      .where(
        and(
          eq(personalTransactions.organizationId, organizationId),
          eq(personalTransactions.kind, "expense"),
          gte(personalTransactions.occurredAt, start),
          lt(personalTransactions.occurredAt, end),
        ),
      )
      .groupBy(personalTransactions.categoryId),
  ]);

  const categoryIds = new Set([
    ...budgets.map((b) => b.categoryId),
    ...actualRows.map((r) => r.categoryId).filter((id): id is string => id !== null),
  ]);

  return Array.from(categoryIds).map((categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    const planned = Number(budgets.find((b) => b.categoryId === categoryId)?.plannedAmount ?? 0);
    const actual = Number(actualRows.find((r) => r.categoryId === categoryId)?.total ?? 0);
    return {
      categoryId,
      categoryName: category?.name ?? "Sem categoria",
      planned,
      actual,
      remaining: planned - actual,
    };
  });
}
