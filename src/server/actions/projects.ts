"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { contracts, projectChecklistItems, projectStages, projects } from "../db/schema";

const DEFAULT_STAGES = [
  { name: "Aguardando pagamento", position: 1, color: "#64748b" },
  { name: "Aguardando materiais", position: 2, color: "#f59e0b" },
  { name: "Planejamento", position: 3, color: "#3b82f6" },
  { name: "Design", position: 4, color: "#8b5cf6" },
  { name: "Desenvolvimento", position: 5, color: "#6366f1" },
  { name: "Revisão interna", position: 6, color: "#ec4899" },
  { name: "Aprovação do cliente", position: 7, color: "#eab308" },
  { name: "Publicação", position: 8, color: "#14b8a6" },
  { name: "Entregue", position: 9, color: "#10b981" },
];

const DEFAULT_CHECKLIST = [
  "Confirmar pagamento inicial",
  "Coletar materiais do cliente",
  "Enviar link de acompanhamento",
];

async function getOrCreateDefaultStages(organizationId: string) {
  let stages = await db.query.projectStages.findMany({
    where: eq(projectStages.organizationId, organizationId),
    orderBy: [asc(projectStages.position)],
  });

  if (stages.length === 0) {
    await db.insert(projectStages).values(DEFAULT_STAGES.map((s) => ({ ...s, organizationId })));
    stages = await db.query.projectStages.findMany({
      where: eq(projectStages.organizationId, organizationId),
      orderBy: [asc(projectStages.position)],
    });
  }

  return stages;
}

export async function getProjects() {
  const { organizationId } = await requirePermission("projects.read");

  const stages = await getOrCreateDefaultStages(organizationId);
  const stageById = new Map(stages.map((s) => [s.id, s]));

  const allProjects = await db.query.projects.findMany({
    where: eq(projects.organizationId, organizationId),
    orderBy: [desc(projects.createdAt)],
  });

  return allProjects.map((project) => ({
    ...project,
    stageName: project.stageId ? (stageById.get(project.stageId)?.name ?? "-") : "-",
    stageColor: project.stageId ? (stageById.get(project.stageId)?.color ?? "#64748b") : "#64748b",
  }));
}

export async function getProjectStages() {
  const { organizationId } = await requirePermission("projects.read");
  return getOrCreateDefaultStages(organizationId);
}

export async function getProjectById(id: string) {
  const { organizationId } = await requirePermission("projects.read");

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.organizationId, organizationId)),
  });
  if (!project) return null;

  const checklist = await db.query.projectChecklistItems.findMany({
    where: eq(projectChecklistItems.projectId, id),
    orderBy: [asc(projectChecklistItems.position)],
  });

  return { ...project, checklist };
}

export async function getSignedContractsWithoutProject() {
  const { organizationId } = await requirePermission("projects.create");

  const signedContracts = await db.query.contracts.findMany({
    where: and(eq(contracts.organizationId, organizationId), eq(contracts.status, "signed")),
  });

  const existingProjects = await db.query.projects.findMany({
    where: eq(projects.organizationId, organizationId),
  });
  const contractIdsWithProject = new Set(existingProjects.map((p) => p.contractId).filter(Boolean));

  return signedContracts.filter((c) => !contractIdsWithProject.has(c.id));
}

export async function createProjectFromContract(contractId: string) {
  const { organizationId, userId } = await requirePermission("projects.create");

  const contract = await db.query.contracts.findFirst({
    where: and(eq(contracts.id, contractId), eq(contracts.organizationId, organizationId)),
  });
  if (!contract) throw new Error("Contrato não encontrado");
  if (contract.status !== "signed") {
    throw new Error("Só é possível gerar projeto a partir de um contrato assinado");
  }

  const existingProject = await db.query.projects.findFirst({
    where: and(eq(projects.organizationId, organizationId), eq(projects.contractId, contractId)),
  });
  if (existingProject) {
    throw new Error("Este contrato já possui um projeto vinculado");
  }

  const stages = await getOrCreateDefaultStages(organizationId);
  const firstStage = stages[0];

  const [project] = await db
    .insert(projects)
    .values({
      organizationId,
      opportunityId: contract.opportunityId,
      contractId: contract.id,
      stageId: firstStage?.id,
      ownerUserId: userId,
      name: contract.title,
      status: "planned",
    })
    .returning();

  await db.insert(projectChecklistItems).values(
    DEFAULT_CHECKLIST.map((title, index) => ({
      projectId: project.id,
      title,
      position: index,
    })),
  );

  revalidatePath("/crm/projetos");
  return project;
}

export async function updateProjectStage(id: string, stageId: string) {
  const { organizationId } = await requirePermission("projects.update");

  await db
    .update(projects)
    .set({ stageId, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)));

  revalidatePath("/crm/projetos");
  revalidatePath(`/crm/projetos/${id}`);
  return { success: true };
}

export async function toggleChecklistItem(itemId: string, projectId: string, isCompleted: boolean) {
  const { organizationId, userId } = await requirePermission("projects.update");

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
  });
  if (!project) throw new Error("Projeto não encontrado");

  await db
    .update(projectChecklistItems)
    .set({
      isCompleted,
      completedBy: isCompleted ? userId : null,
      completedAt: isCompleted ? new Date() : null,
    })
    .where(
      and(eq(projectChecklistItems.id, itemId), eq(projectChecklistItems.projectId, projectId)),
    );

  revalidatePath(`/crm/projetos/${projectId}`);
  return { success: true };
}
