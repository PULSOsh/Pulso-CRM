"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { personalDebts, personalGoals } from "../db/schema";
import { requirePersonalAccess } from "../services/personal-workspace";
import {
  contributeToGoalSchema,
  payDebtSchema,
  personalDebtSchema,
  personalGoalSchema,
} from "./personal-goals.schemas";

export async function getPersonalGoals() {
  const { organizationId } = await requirePersonalAccess("read");
  return db.query.personalGoals.findMany({
    where: and(eq(personalGoals.organizationId, organizationId), eq(personalGoals.isActive, true)),
    orderBy: [asc(personalGoals.targetDate)],
  });
}

export async function createPersonalGoal(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalGoalSchema.parse(input);

  const [goal] = await db
    .insert(personalGoals)
    .values({
      organizationId,
      name: parsed.name,
      targetAmount: parsed.targetAmount.toFixed(2),
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
    })
    .returning();

  revalidatePath("/crm/pessoal");
  return goal;
}

export async function contributeToPersonalGoal(id: string, input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = contributeToGoalSchema.parse(input);

  const [updated] = await db
    .update(personalGoals)
    .set({ currentAmount: sql`${personalGoals.currentAmount} + ${parsed.amount.toFixed(2)}` })
    .where(and(eq(personalGoals.id, id), eq(personalGoals.organizationId, organizationId)))
    .returning({ id: personalGoals.id });
  if (!updated) throw new Error("Meta não encontrada.");

  revalidatePath("/crm/pessoal");
  return { success: true };
}

export async function deactivatePersonalGoal(id: string) {
  const { organizationId } = await requirePersonalAccess("manage");
  const [updated] = await db
    .update(personalGoals)
    .set({ isActive: false })
    .where(and(eq(personalGoals.id, id), eq(personalGoals.organizationId, organizationId)))
    .returning({ id: personalGoals.id });
  if (!updated) throw new Error("Meta não encontrada.");

  revalidatePath("/crm/pessoal");
  return { success: true };
}

export async function getPersonalDebts() {
  const { organizationId } = await requirePersonalAccess("read");
  return db.query.personalDebts.findMany({
    where: eq(personalDebts.organizationId, organizationId),
    orderBy: [asc(personalDebts.dueDate)],
  });
}

export async function createPersonalDebt(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalDebtSchema.parse(input);

  const [debt] = await db
    .insert(personalDebts)
    .values({
      organizationId,
      name: parsed.name,
      totalAmount: parsed.totalAmount.toFixed(2),
      remainingAmount: parsed.totalAmount.toFixed(2),
      interestRate: parsed.interestRate?.toFixed(3),
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
    })
    .returning();

  revalidatePath("/crm/pessoal");
  return debt;
}

export async function payPersonalDebt(id: string, input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = payDebtSchema.parse(input);

  const debt = await db.query.personalDebts.findFirst({
    where: and(eq(personalDebts.id, id), eq(personalDebts.organizationId, organizationId)),
  });
  if (!debt) throw new Error("Dívida não encontrada.");
  if (debt.status === "paid") throw new Error("Dívida já quitada.");

  const remaining = Math.max(0, Number(debt.remainingAmount) - parsed.amount);
  await db
    .update(personalDebts)
    .set({
      remainingAmount: remaining.toFixed(2),
      status: remaining <= 0.005 ? "paid" : "open",
      updatedAt: new Date(),
    })
    .where(eq(personalDebts.id, id));

  revalidatePath("/crm/pessoal");
  return { success: true };
}
