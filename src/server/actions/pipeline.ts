"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  opportunities,
  opportunityStageHistory,
  pipelineStages,
  pipelines,
  tasks,
} from "../db/schema";
import { logActivity } from "../services/activity-log";

export async function getPipelineWithOpportunities() {
  const { organizationId } = await requirePermission("opportunities.read");

  // Fetch default pipeline for the organization
  let defaultPipeline = await db.query.pipelines.findFirst({
    where: eq(pipelines.organizationId, organizationId),
  });

  if (!defaultPipeline) {
    const [inserted] = await db
      .insert(pipelines)
      .values({
        organizationId,
        name: "Funil Padrão",
        isDefault: true,
      })
      .returning();
    defaultPipeline = inserted;

    await db.insert(pipelineStages).values([
      {
        pipelineId: defaultPipeline.id,
        name: "Lead",
        position: 1,
        color: "#64748b",
        probability: 10,
      },
      {
        pipelineId: defaultPipeline.id,
        name: "Qualificação",
        position: 2,
        color: "#3b82f6",
        probability: 30,
      },
      {
        pipelineId: defaultPipeline.id,
        name: "Proposta Enviada",
        position: 3,
        color: "#f59e0b",
        probability: 60,
      },
      {
        pipelineId: defaultPipeline.id,
        name: "Negociação",
        position: 4,
        color: "#8b5cf6",
        probability: 80,
      },
      {
        pipelineId: defaultPipeline.id,
        name: "Fechado",
        position: 5,
        color: "#10b981",
        isWon: true,
        probability: 100,
      },
      {
        pipelineId: defaultPipeline.id,
        name: "Perdido",
        position: 6,
        color: "#ef4444",
        probability: 0,
      },
    ]);
  }

  // Backfill: pipelines created before the "Perdido" stage existed (or before
  // this idempotent check was added) won't have it - add it once, without
  // touching any existing stage. Needed for loseOpportunity() to have a
  // stage to move the card into.
  const hasLostStage = await db.query.pipelineStages.findFirst({
    where: and(
      eq(pipelineStages.pipelineId, defaultPipeline.id),
      eq(pipelineStages.name, "Perdido"),
    ),
  });
  if (!hasLostStage) {
    const [lastStage] = await db.query.pipelineStages.findMany({
      where: eq(pipelineStages.pipelineId, defaultPipeline.id),
      orderBy: [desc(pipelineStages.position)],
      limit: 1,
    });
    await db.insert(pipelineStages).values({
      pipelineId: defaultPipeline.id,
      name: "Perdido",
      position: (lastStage?.position ?? 0) + 1,
      color: "#ef4444",
      probability: 0,
    });
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
      owner: {
        columns: {
          name: true,
        },
      },
      activities: {
        columns: { id: true },
      },
      tasks: {
        where: eq(tasks.status, "todo"),
        columns: { id: true },
      },
      opportunityProducts: {
        limit: 1,
        with: {
          product: {
            columns: { name: true },
          },
        },
      },
    },
    orderBy: [asc(opportunities.position)],
  });

  const opportunitiesWithCounts = openOpportunities.map((opp) => ({
    ...opp,
    activitiesCount: opp.activities.length,
    openTasksCount: opp.tasks.length,
    productName: opp.opportunityProducts[0]?.product?.name ?? null,
  }));

  // Group opportunities by stage, with a value subtotal per stage
  const stagesWithOpportunities = stages.map((stage) => {
    const stageOpportunities = opportunitiesWithCounts.filter((opp) => opp.stageId === stage.id);
    return {
      ...stage,
      opportunities: stageOpportunities,
      valueTotal: stageOpportunities.reduce((sum, opp) => sum + Number(opp.estimatedValue), 0),
    };
  });

  const summary = {
    openCount: opportunitiesWithCounts.length,
    pipelineValue: opportunitiesWithCounts.reduce(
      (sum, opp) => sum + Number(opp.estimatedValue),
      0,
    ),
    weightedForecast: opportunitiesWithCounts.reduce((sum, opp) => {
      const stage = stages.find((s) => s.id === opp.stageId);
      const probability = opp.probability ?? stage?.probability ?? 0;
      return sum + (Number(opp.estimatedValue) * probability) / 100;
    }, 0),
  };

  return {
    pipeline: defaultPipeline,
    stages: stagesWithOpportunities,
    summary,
  };
}

export async function moveOpportunity(
  opportunityId: string,
  newStageId: string,
  newPosition: number,
) {
  const { organizationId, userId } = await requirePermission("opportunities.move");

  const opp = await db.query.opportunities.findFirst({
    where: and(
      eq(opportunities.id, opportunityId),
      eq(opportunities.organizationId, organizationId),
    ),
  });

  if (!opp) throw new Error("Oportunidade não encontrada");

  const oldStageId = opp.stageId;

  await db.transaction(async (tx) => {
    // 1. Update Opportunity
    await tx
      .update(opportunities)
      .set({
        stageId: newStageId,
        position: newPosition.toString(),
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId));

    // 2. Log History if Stage changed
    if (oldStageId !== newStageId) {
      await tx.insert(opportunityStageHistory).values({
        opportunityId,
        fromStageId: oldStageId,
        toStageId: newStageId,
        movedBy: userId,
        reason: "Arrastado pelo Kanban",
      });

      const newStage = await tx.query.pipelineStages.findFirst({
        where: eq(pipelineStages.id, newStageId),
        columns: { name: true },
      });

      await logActivity(
        {
          organizationId,
          actorUserId: userId,
          type: "stage_change",
          title: newStage ? `Movido para "${newStage.name}"` : "Etapa alterada",
          opportunityId,
        },
        tx,
      );
    }
  });

  revalidatePath("/crm/pipeline");
  return { success: true };
}

export async function createOpportunity(data: {
  pipelineId: string;
  title: string;
  companyId?: string;
  primaryContactId?: string;
  stageId: string;
  estimatedValue?: string;
  temperature?: string;
}) {
  const { organizationId, userId } = await requirePermission("opportunities.create");

  const [lastInStage] = await db.query.opportunities.findMany({
    where: eq(opportunities.stageId, data.stageId),
    orderBy: [desc(opportunities.position)],
    limit: 1,
  });
  const nextPosition = (lastInStage ? Number(lastInStage.position) : 0) + 1000;

  const [opp] = await db
    .insert(opportunities)
    .values({
      organizationId,
      pipelineId: data.pipelineId,
      title: data.title,
      companyId: data.companyId,
      primaryContactId: data.primaryContactId,
      stageId: data.stageId,
      estimatedValue: data.estimatedValue,
      temperature: data.temperature || "warm",
      ownerUserId: userId,
      position: nextPosition.toString(),
    })
    .returning();

  revalidatePath("/crm/pipeline");
  return opp;
}
