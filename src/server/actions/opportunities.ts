"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { opportunities } from "../db/schema";
import { nextActionSchema } from "./opportunities.schemas";

export async function updateNextAction(
  opportunityId: string,
  input: { nextActionAt: string | null; nextActionDescription: string | null },
) {
  const { organizationId } = await requirePermission("opportunities.update");
  const parsed = nextActionSchema.parse(input);

  const [updated] = await db
    .update(opportunities)
    .set({
      nextActionAt: parsed.nextActionAt ? new Date(parsed.nextActionAt) : null,
      nextActionDescription: parsed.nextActionDescription,
      updatedAt: new Date(),
    })
    .where(
      and(eq(opportunities.id, opportunityId), eq(opportunities.organizationId, organizationId)),
    )
    .returning({ id: opportunities.id });

  if (!updated) throw new Error("Oportunidade não encontrada.");

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/pipeline");
  return { success: true };
}
