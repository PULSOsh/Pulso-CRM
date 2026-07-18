"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { activities, opportunities } from "../db/schema";
import { logActivity } from "../services/activity-log";
import { addNoteSchema } from "./activities.schemas";

export async function getOpportunityActivities(opportunityId: string) {
  const { organizationId } = await requirePermission("opportunities.read");

  // Confirm the opportunity belongs to this org before returning its
  // activity log - opportunityId alone isn't enough to trust.
  const opp = await db.query.opportunities.findFirst({
    where: and(eq(opportunities.id, opportunityId), eq(opportunities.organizationId, organizationId)),
    columns: { id: true },
  });
  if (!opp) throw new Error("Oportunidade não encontrada.");

  return await db.query.activities.findMany({
    where: eq(activities.opportunityId, opportunityId),
    orderBy: [desc(activities.occurredAt)],
    with: { actor: { columns: { name: true } } },
  });
}

export async function addNote(opportunityId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("opportunities.update");
  const parsed = addNoteSchema.parse(input);

  const opp = await db.query.opportunities.findFirst({
    where: and(eq(opportunities.id, opportunityId), eq(opportunities.organizationId, organizationId)),
    columns: { id: true },
  });
  if (!opp) throw new Error("Oportunidade não encontrada.");

  await logActivity({
    organizationId,
    actorUserId: userId,
    type: "note",
    title: "Nota adicionada",
    body: parsed.body,
    opportunityId,
  });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  return { success: true };
}
