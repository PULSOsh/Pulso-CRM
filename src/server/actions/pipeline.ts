"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  opportunities,
  opportunityProducts,
  opportunityStageHistory,
  pipelineStages,
  pipelines,
  products,
  tasks,
} from "../db/schema";
import { logActivity } from "../services/activity-log";
import {
  type CreatePipelineInput,
  createPipelineSchema,
  type OpportunityProductInput,
  opportunityProductSchema,
  updateOpportunitySchema,
} from "./pipeline.schemas";

// Seis etapas comerciais padrão (docs/MODULE_SPECIFICATIONS.md seção 4 - "Funil
// inicial"), usadas tanto para o funil default (bootstrap idempotente) quanto
// para todo novo funil criado por createPipeline().
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_STAGE_TEMPLATE = [
  { name: "Lead", position: 1, color: "#64748b", probability: 10 },
  { name: "Qualificação", position: 2, color: "#3b82f6", probability: 30 },
  { name: "Proposta Enviada", position: 3, color: "#f59e0b", probability: 60 },
  { name: "Negociação", position: 4, color: "#8b5cf6", probability: 80 },
  { name: "Fechado", position: 5, color: "#10b981", probability: 100, isWon: true },
  { name: "Perdido", position: 6, color: "#ef4444", probability: 0 },
] as const;

async function ensureDefaultPipeline(organizationId: string) {
  let defaultPipeline = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.organizationId, organizationId), eq(pipelines.isDefault, true)),
  });

  if (!defaultPipeline) {
    // Organização antiga sem is_default marcado ainda: reaproveita o primeiro
    // funil existente em vez de criar um segundo default.
    defaultPipeline = await db.query.pipelines.findFirst({
      where: eq(pipelines.organizationId, organizationId),
      orderBy: [asc(pipelines.createdAt)],
    });
    if (defaultPipeline) {
      await db
        .update(pipelines)
        .set({ isDefault: true })
        .where(eq(pipelines.id, defaultPipeline.id));
    }
  }

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

    await db
      .insert(pipelineStages)
      .values(DEFAULT_STAGE_TEMPLATE.map((stage) => ({ ...stage, pipelineId: inserted.id })));
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

  return defaultPipeline;
}

export async function getPipelines() {
  const { organizationId } = await requirePermission("pipelines.read");

  return db.query.pipelines.findMany({
    where: and(eq(pipelines.organizationId, organizationId), eq(pipelines.isActive, true)),
    orderBy: [desc(pipelines.isDefault), asc(pipelines.createdAt)],
  });
}

export async function createPipeline(input: unknown) {
  const { organizationId } = await requirePermission("pipelines.manage");
  const parsed: CreatePipelineInput = createPipelineSchema.parse(input);

  const [pipeline] = await db
    .insert(pipelines)
    .values({ organizationId, name: parsed.name })
    .returning();

  await db
    .insert(pipelineStages)
    .values(DEFAULT_STAGE_TEMPLATE.map((stage) => ({ ...stage, pipelineId: pipeline.id })));

  revalidatePath("/crm/pipeline");
  return pipeline;
}

export async function getPipelineWithOpportunities(pipelineId?: string) {
  const { organizationId } = await requirePermission("opportunities.read");

  // Seleção só é aceita se o funil pertencer à organização atual e estiver
  // ativo; caso contrário (id inexistente, de outra organização, ou
  // desativado) cai silenciosamente no funil padrão, sem expor se o id
  // existe em outra organização.
  let pipeline = pipelineId && UUID_PATTERN.test(pipelineId)
    ? await db.query.pipelines.findFirst({
        where: and(
          eq(pipelines.id, pipelineId),
          eq(pipelines.organizationId, organizationId),
          eq(pipelines.isActive, true),
        ),
      })
    : undefined;

  if (!pipeline) {
    pipeline = await ensureDefaultPipeline(organizationId);
  }

  // Fetch stages ordered by position
  const stages = await db.query.pipelineStages.findMany({
    where: eq(pipelineStages.pipelineId, pipeline.id),
    orderBy: [asc(pipelineStages.position)],
  });

  // Fetch all OPEN opportunities for this pipeline
  const openOpportunities = await db.query.opportunities.findMany({
    where: and(eq(opportunities.pipelineId, pipeline.id), eq(opportunities.status, "open")),
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
    pipeline,
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

  // newStageId vem do cliente - confirma que pertence ao mesmo funil da
  // oportunidade antes de gravar, para não deixar o registro com stageId de
  // um funil (possivelmente de outra organização) diferente do seu próprio
  // pipelineId.
  const targetStage = await db.query.pipelineStages.findFirst({
    where: and(eq(pipelineStages.id, newStageId), eq(pipelineStages.pipelineId, opp.pipelineId)),
    columns: { id: true },
  });
  if (!targetStage) throw new Error("Etapa não encontrada neste funil.");

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

  // pipelineId/stageId chegam do cliente - confirma que o funil pertence à
  // organização da sessão e que a etapa pertence a esse funil antes de
  // inserir, para que uma oportunidade nunca fique vinculada a um funil de
  // outra organização (o que a faria aparecer no Kanban alheio, já que
  // getPipelineWithOpportunities filtra oportunidades só por pipelineId).
  const pipeline = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.id, data.pipelineId), eq(pipelines.organizationId, organizationId)),
    columns: { id: true },
  });
  if (!pipeline) throw new Error("Funil não encontrado.");

  const stage = await db.query.pipelineStages.findFirst({
    where: and(eq(pipelineStages.id, data.stageId), eq(pipelineStages.pipelineId, pipeline.id)),
    columns: { id: true },
  });
  if (!stage) throw new Error("Etapa não encontrada neste funil.");

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

export async function updateOpportunity(opportunityId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("opportunities.update");
  const parsed = updateOpportunitySchema.parse(input);

  const [updated] = await db
    .update(opportunities)
    .set({
      title: parsed.title,
      description: parsed.description || null,
      source: parsed.source || null,
      estimatedValue:
        parsed.estimatedValue !== undefined ? parsed.estimatedValue.toString() : undefined,
      negotiatedValue:
        parsed.negotiatedValue !== undefined ? parsed.negotiatedValue.toString() : null,
      probability: parsed.probability ?? null,
      expectedCloseDate: parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null,
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
    type: "note",
    title: `Negociação atualizada: ${parsed.title}`,
    opportunityId,
  });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/pipeline");
  return { success: true };
}

export async function addOpportunityProduct(opportunityId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("opportunities.update");
  const parsed: OpportunityProductInput = opportunityProductSchema.parse(input);

  const opp = await db.query.opportunities.findFirst({
    where: and(
      eq(opportunities.id, opportunityId),
      eq(opportunities.organizationId, organizationId),
    ),
    columns: { id: true },
  });
  if (!opp) throw new Error("Oportunidade não encontrada.");

  const product = await db.query.products.findFirst({
    where: eq(products.id, parsed.productId),
    columns: { name: true },
  });
  if (!product) throw new Error("Produto não encontrado.");

  await db
    .insert(opportunityProducts)
    .values({
      opportunityId,
      productId: parsed.productId,
      quantity: parsed.quantity.toString(),
      unitPrice: parsed.unitPrice.toString(),
      discount: parsed.discount.toString(),
      notes: parsed.notes || null,
    })
    .onConflictDoUpdate({
      target: [opportunityProducts.opportunityId, opportunityProducts.productId],
      set: {
        quantity: parsed.quantity.toString(),
        unitPrice: parsed.unitPrice.toString(),
        discount: parsed.discount.toString(),
        notes: parsed.notes || null,
      },
    });

  await logActivity({
    organizationId,
    actorUserId: userId,
    type: "note",
    title: `Produto vinculado: ${product.name}`,
    opportunityId,
  });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  return { success: true };
}

export async function removeOpportunityProduct(opportunityId: string, productId: string) {
  const { organizationId } = await requirePermission("opportunities.update");

  const opp = await db.query.opportunities.findFirst({
    where: and(
      eq(opportunities.id, opportunityId),
      eq(opportunities.organizationId, organizationId),
    ),
    columns: { id: true },
  });
  if (!opp) throw new Error("Oportunidade não encontrada.");

  await db
    .delete(opportunityProducts)
    .where(
      and(
        eq(opportunityProducts.opportunityId, opportunityId),
        eq(opportunityProducts.productId, productId),
      ),
    );

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  return { success: true };
}
