"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { personalRecurrences, personalTransactions } from "../db/schema";
import { requirePersonalAccess } from "../services/personal-workspace";
import { calculateNextDueDate } from "../services/recurrence";
import { personalRecurrenceSchema } from "./personal-recurrences.schemas";

export async function getPersonalRecurrences() {
  const { organizationId } = await requirePersonalAccess("read");

  return db.query.personalRecurrences.findMany({
    where: eq(personalRecurrences.organizationId, organizationId),
    orderBy: [asc(personalRecurrences.nextRunDate)],
  });
}

export async function createPersonalRecurrence(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalRecurrenceSchema.parse(input);

  const [rule] = await db
    .insert(personalRecurrences)
    .values({
      organizationId,
      kind: parsed.kind,
      frequency: parsed.frequency,
      accountId: parsed.accountId || null,
      categoryId: parsed.categoryId || null,
      description: parsed.description,
      amount: parsed.amount.toFixed(2),
      startDate: new Date(parsed.startDate),
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      nextRunDate: new Date(parsed.startDate),
    })
    .returning();

  revalidatePath("/crm/pessoal");
  return rule;
}

export async function deactivatePersonalRecurrence(id: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const [updated] = await db
    .update(personalRecurrences)
    .set({ isActive: false })
    .where(
      and(eq(personalRecurrences.id, id), eq(personalRecurrences.organizationId, organizationId)),
    )
    .returning({ id: personalRecurrences.id });
  if (!updated) throw new Error("Regra de recorrência não encontrada.");

  revalidatePath("/crm/pessoal");
  return { success: true };
}

/** CRM-F4-05: mesmo padrão de generateNextRecurrenceOccurrence (Fase 3) -
 * sem motor de automação, geração manual sob demanda. */
export async function generateNextPersonalOccurrence(ruleId: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const rule = await db.query.personalRecurrences.findFirst({
    where: and(
      eq(personalRecurrences.id, ruleId),
      eq(personalRecurrences.organizationId, organizationId),
    ),
  });
  if (!rule) throw new Error("Regra de recorrência não encontrada.");
  if (!rule.isActive) throw new Error("Regra de recorrência está desativada.");
  if (rule.endDate && rule.nextRunDate > rule.endDate) {
    throw new Error("Esta regra já passou da data de encerramento.");
  }

  const occurredAt = rule.nextRunDate;
  const nextRunDate = calculateNextDueDate(occurredAt, rule.frequency, 1);

  const [created] = await db
    .insert(personalTransactions)
    .values({
      organizationId,
      accountId: rule.accountId,
      categoryId: rule.categoryId,
      kind: rule.kind,
      amount: rule.amount,
      occurredAt,
      description: `${rule.description} (recorrência)`,
    })
    .returning();

  await db
    .update(personalRecurrences)
    .set({ nextRunDate, lastGeneratedAt: new Date() })
    .where(eq(personalRecurrences.id, ruleId));

  revalidatePath("/crm/pessoal");
  return created;
}
