"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { costCenters } from "../db/schema";
import { costCenterSchema } from "./cost-centers.schemas";

export async function getCostCenters() {
  const { organizationId } = await requirePermission("cost_centers.read");

  return db.query.costCenters.findMany({
    where: eq(costCenters.organizationId, organizationId),
    orderBy: [asc(costCenters.name)],
  });
}

export async function createCostCenter(input: unknown) {
  const { organizationId } = await requirePermission("cost_centers.manage");
  const parsed = costCenterSchema.parse(input);

  const existing = await db.query.costCenters.findFirst({
    where: and(eq(costCenters.organizationId, organizationId), eq(costCenters.name, parsed.name)),
  });
  if (existing) throw new Error("Já existe um centro de custo com este nome.");

  const [created] = await db
    .insert(costCenters)
    .values({ organizationId, name: parsed.name })
    .returning();

  revalidatePath("/crm/financeiro");
  return created;
}

export async function deactivateCostCenter(id: string) {
  const { organizationId } = await requirePermission("cost_centers.manage");

  const [updated] = await db
    .update(costCenters)
    .set({ isActive: false })
    .where(and(eq(costCenters.id, id), eq(costCenters.organizationId, organizationId)))
    .returning({ id: costCenters.id });
  if (!updated) throw new Error("Centro de custo não encontrado.");

  revalidatePath("/crm/financeiro");
  return { success: true };
}
