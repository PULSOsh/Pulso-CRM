"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { automationRules } from "../db/schema";
import type { AutomationAction, AutomationCondition } from "../services/automation";
import { automationRuleSchema } from "./automation-rules.schemas";

export async function getAutomationRules() {
  const { organizationId } = await requirePermission("automation.read");

  return db.query.automationRules.findMany({
    where: eq(automationRules.organizationId, organizationId),
    orderBy: [desc(automationRules.createdAt)],
  }) as Promise<
    (typeof automationRules.$inferSelect & {
      conditions: AutomationCondition[];
      actions: AutomationAction[];
    })[]
  >;
}

export async function createAutomationRule(input: unknown) {
  const { organizationId, userId } = await requirePermission("automation.manage");
  const parsed = automationRuleSchema.parse(input);

  const [rule] = await db
    .insert(automationRules)
    .values({
      organizationId,
      name: parsed.name,
      triggerType: parsed.triggerType,
      conditions: parsed.conditions,
      actions: parsed.actions,
      createdBy: userId,
    })
    .returning();

  revalidatePath("/crm/automacoes");
  return rule;
}

export async function setAutomationRuleActive(id: string, isActive: boolean) {
  const { organizationId } = await requirePermission("automation.manage");

  const [updated] = await db
    .update(automationRules)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(automationRules.id, id), eq(automationRules.organizationId, organizationId)))
    .returning({ id: automationRules.id });
  if (!updated) throw new Error("Regra de automação não encontrada.");

  revalidatePath("/crm/automacoes");
  return { success: true };
}
