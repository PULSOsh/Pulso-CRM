"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { opportunities, opportunityStageHistory, pipelineStages, pipelines } from "../db/schema";

export async function getPipelineWithOpportunities(organizationId: string) {
  // Fetch default pipeline for the organization
  const defaultPipeline = await db.query.pipelines.findFirst({
    where: eq(pipelines.organizationId, organizationId),
  });

  if (!defaultPipeline) {
    throw new Error("Pipeline não encontrado");
  }

  // Fetch stages ordered by position
  const stages = await db.query.pipelineStages.findMany({
    where: eq(pipelineStages.pipelineId, defaultPipeline.id),
    orderBy: [asc(pipelineStages.position)],
  });

  // Fetch all OPEN opportunities for this pipeline
  const openOpportunities = await db.query.opportunities.findMany({
    where: and(eq(opportunities.pipelineId, defaultPipeline.id), eq(opportunities.status, "open")),
    with: {
      company: {
        columns: {
          tradeName: true,
        },
      },
      primaryContact: {
        columns: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [asc(opportunities.position)],
  });

  // Group opportunities by stage
  const stagesWithOpportunities = stages.map((stage) => ({
    ...stage,
    opportunities: openOpportunities.filter((opp) => opp.stageId === stage.id),
  }));

  return {
    pipeline: defaultPipeline,
    stages: stagesWithOpportunities,
  };
}

export async function moveOpportunity(
  opportunityId: string,
  newStageId: string,
  newPosition: number,
  userId: string,
  organizationId: string,
) {
  const opp = await db.query.opportunities.findFirst({
    where: and(
      eq(opportunities.id, opportunityId),
      eq(opportunities.organizationId, organizationId),
    ),
  });

  if (!opp) throw new Error("Oportunidade não encontrada");

  const oldStageId = opp.stageId;

  // 1. Update Opportunity
  await db
    .update(opportunities)
    .set({
      stageId: newStageId,
      position: newPosition.toString(),
      updatedAt: new Date(),
    })
    .where(eq(opportunities.id, opportunityId));

  // 2. Log History if Stage changed
  if (oldStageId !== newStageId) {
    await db.insert(opportunityStageHistory).values({
      opportunityId,
      fromStageId: oldStageId,
      toStageId: newStageId,
      movedBy: userId,
      reason: "Arrastado pelo Kanban",
    });
  }

  revalidatePath("/crm/pipeline");
  return { success: true };
}
