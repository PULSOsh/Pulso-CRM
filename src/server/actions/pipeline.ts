"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { opportunities, opportunityStageHistory, pipelineStages, pipelines } from "../db/schema";

export async function getPipelineWithOpportunities(organizationId: string) {
  // Fetch default pipeline for the organization
  let defaultPipeline = await db.query.pipelines.findFirst({
    where: eq(pipelines.organizationId, organizationId),
  });

  if (!defaultPipeline) {
    const [inserted] = await db.insert(pipelines).values({
      organizationId,
      name: "Funil Padrão",
      isDefault: true,
    }).returning();
    defaultPipeline = inserted;

    await db.insert(pipelineStages).values([
      { pipelineId: defaultPipeline.id, name: "Lead", position: 1, color: "#64748b", probability: 10 },
      { pipelineId: defaultPipeline.id, name: "Qualificação", position: 2, color: "#3b82f6", probability: 30 },
      { pipelineId: defaultPipeline.id, name: "Proposta Enviada", position: 3, color: "#f59e0b", probability: 60 },
      { pipelineId: defaultPipeline.id, name: "Negociação", position: 4, color: "#8b5cf6", probability: 80 },
      { pipelineId: defaultPipeline.id, name: "Fechado", position: 5, color: "#10b981", isWon: true, probability: 100 },
    ]);
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

export async function createOpportunity(data: {
  organizationId: string;
  pipelineId: string;
  title: string;
  companyId?: string;
  primaryContactId?: string;
  stageId: string;
  estimatedValue?: string;
  ownerUserId: string;
}) {
  const [lastInStage] = await db.query.opportunities.findMany({
    where: eq(opportunities.stageId, data.stageId),
    orderBy: [desc(opportunities.position)],
    limit: 1,
  });
  const nextPosition = (lastInStage ? Number(lastInStage.position) : 0) + 1000;

  const [opp] = await db.insert(opportunities).values({
    organizationId: data.organizationId,
    pipelineId: data.pipelineId,
    title: data.title,
    companyId: data.companyId,
    primaryContactId: data.primaryContactId,
    stageId: data.stageId,
    estimatedValue: data.estimatedValue,
    ownerUserId: data.ownerUserId,
    position: nextPosition.toString(),
  }).returning();

  revalidatePath("/crm/pipeline");
  return opp;
}
