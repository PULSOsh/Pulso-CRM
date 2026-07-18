"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { opportunities, opportunityStageHistory, pipelineStages } from "../db/schema";
import { logActivity } from "../services/activity-log";
import { loseOpportunitySchema, nextActionSchema } from "./opportunities.schemas";

export async function updateNextAction(
  opportunityId: string,
  input: { nextActionAt: string | null; nextActionDescription: string | null },
) {
  const { organizationId, userId } = await requirePermission("opportunities.update");
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

  await logActivity({
    organizationId,
    actorUserId: userId,
    type: "system",
    title: parsed.nextActionAt ? "Próxima ação definida" : "Próxima ação removida",
    body: parsed.nextActionDescription ?? undefined,
    opportunityId,
  });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/pipeline");
  return { success: true };
}

export async function winOpportunity(opportunityId: string) {
  const { organizationId, userId } = await requirePermission("opportunities.win");

  await db.transaction(async (tx) => {
    const opp = await tx.query.opportunities.findFirst({
      where: and(
        eq(opportunities.id, opportunityId),
        eq(opportunities.organizationId, organizationId),
      ),
    });
    if (!opp) throw new Error("Oportunidade não encontrada.");
    if (opp.status !== "open") {
      throw new Error("Só é possível marcar como ganha uma oportunidade em aberto.");
    }

    const wonStage = await tx.query.pipelineStages.findFirst({
      where: and(eq(pipelineStages.pipelineId, opp.pipelineId), eq(pipelineStages.isWon, true)),
    });

    await tx
      .update(opportunities)
      .set({
        status: "won",
        wonAt: new Date(),
        stageId: wonStage?.id ?? opp.stageId,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId));

    if (wonStage && wonStage.id !== opp.stageId) {
      await tx.insert(opportunityStageHistory).values({
        opportunityId,
        fromStageId: opp.stageId,
        toStageId: wonStage.id,
        movedBy: userId,
        reason: "Marcado como Ganho",
      });
    }

    await logActivity(
      {
        organizationId,
        actorUserId: userId,
        type: "stage_change",
        title: "Oportunidade ganha",
        opportunityId,
      },
      tx,
    );
  });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/pipeline");
  return { success: true };
}

export async function loseOpportunity(opportunityId: string, input: { lostReason: string }) {
  const { organizationId, userId } = await requirePermission("opportunities.lose");
  const parsed = loseOpportunitySchema.parse(input);

  await db.transaction(async (tx) => {
    const opp = await tx.query.opportunities.findFirst({
      where: and(
        eq(opportunities.id, opportunityId),
        eq(opportunities.organizationId, organizationId),
      ),
    });
    if (!opp) throw new Error("Oportunidade não encontrada.");
    if (opp.status !== "open") {
      throw new Error("Só é possível marcar como perdida uma oportunidade em aberto.");
    }

    const lostStage = await tx.query.pipelineStages.findFirst({
      where: and(eq(pipelineStages.pipelineId, opp.pipelineId), eq(pipelineStages.name, "Perdido")),
    });

    await tx
      .update(opportunities)
      .set({
        status: "lost",
        lostAt: new Date(),
        lostReason: parsed.lostReason,
        stageId: lostStage?.id ?? opp.stageId,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId));

    if (lostStage && lostStage.id !== opp.stageId) {
      await tx.insert(opportunityStageHistory).values({
        opportunityId,
        fromStageId: opp.stageId,
        toStageId: lostStage.id,
        movedBy: userId,
        reason: parsed.lostReason,
      });
    }

    await logActivity(
      {
        organizationId,
        actorUserId: userId,
        type: "stage_change",
        title: "Oportunidade perdida",
        body: parsed.lostReason,
        opportunityId,
      },
      tx,
    );
  });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/pipeline");
  return { success: true };
}
