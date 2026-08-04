"use server";

import { and, asc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { milestones, projects } from "../db/schema";
import { createMilestoneSchema } from "./milestones.schemas";

async function findOwnedProject(projectId: string, organizationId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
    columns: { id: true },
  });
  if (!project) throw new Error("Projeto não encontrado.");
  return project;
}

// CRM-F2-03: calendário compartilhado com tarefas (/crm/tarefas/calendario) -
// marcos de todos os projetos da organização com prazo no intervalo, pra
// aparecer ao lado das tarefas no mesmo grid mensal.
export async function getMilestonesForMonth(gridStart: string, gridEnd: string) {
  const { organizationId } = await requirePermission("projects.read");

  const rows = await db
    .select({
      id: milestones.id,
      title: milestones.title,
      dueDate: milestones.dueDate,
      isCompleted: milestones.isCompleted,
      projectId: milestones.projectId,
      projectName: projects.name,
    })
    .from(milestones)
    .innerJoin(projects, eq(projects.id, milestones.projectId))
    .where(
      and(
        eq(milestones.organizationId, organizationId),
        eq(milestones.isCompleted, false),
        gte(milestones.dueDate, new Date(gridStart)),
        lte(milestones.dueDate, new Date(gridEnd)),
      ),
    );

  return rows;
}

export async function getMilestonesForProject(projectId: string) {
  const { organizationId } = await requirePermission("projects.read");
  await findOwnedProject(projectId, organizationId);

  return db.query.milestones.findMany({
    where: eq(milestones.projectId, projectId),
    orderBy: [asc(milestones.position)],
  });
}

export async function createMilestone(projectId: string, input: unknown) {
  const { organizationId } = await requirePermission("projects.update");
  await findOwnedProject(projectId, organizationId);
  const parsed = createMilestoneSchema.parse(input);

  // dependsOnMilestoneId vem do cliente - confirma que pertence ao mesmo
  // projeto antes de gravar (mesma classe de checagem já aplicada a
  // pipelineId/stageId em pipeline.ts).
  if (parsed.dependsOnMilestoneId) {
    const dependency = await db.query.milestones.findFirst({
      where: and(
        eq(milestones.id, parsed.dependsOnMilestoneId),
        eq(milestones.projectId, projectId),
      ),
      columns: { id: true },
    });
    if (!dependency) throw new Error("Marco de dependência não encontrado neste projeto.");
  }

  const [lastMilestone] = await db.query.milestones.findMany({
    where: eq(milestones.projectId, projectId),
    orderBy: (t, { desc }) => [desc(t.position)],
    limit: 1,
  });

  const [milestone] = await db
    .insert(milestones)
    .values({
      organizationId,
      projectId,
      title: parsed.title,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      assignedTo: parsed.assignedTo || null,
      dependsOnMilestoneId: parsed.dependsOnMilestoneId || null,
      position: (lastMilestone?.position ?? 0) + 1,
    })
    .returning();

  revalidatePath(`/crm/projetos/${projectId}`);
  return milestone;
}

export async function toggleMilestone(id: string, projectId: string, isCompleted: boolean) {
  const { organizationId } = await requirePermission("projects.update");
  await findOwnedProject(projectId, organizationId);

  const milestone = await db.query.milestones.findFirst({
    where: and(eq(milestones.id, id), eq(milestones.projectId, projectId)),
  });
  if (!milestone) throw new Error("Marco não encontrado.");

  if (isCompleted && milestone.dependsOnMilestoneId) {
    const dependency = await db.query.milestones.findFirst({
      where: eq(milestones.id, milestone.dependsOnMilestoneId),
      columns: { isCompleted: true, title: true },
    });
    if (dependency && !dependency.isCompleted) {
      throw new Error(`Este marco depende de "${dependency.title}", que ainda não foi concluído.`);
    }
  }

  await db
    .update(milestones)
    .set({ isCompleted, completedAt: isCompleted ? new Date() : null })
    .where(eq(milestones.id, id));

  revalidatePath(`/crm/projetos/${projectId}`);
  return { success: true };
}

export async function deleteMilestone(id: string, projectId: string) {
  const { organizationId } = await requirePermission("projects.update");
  await findOwnedProject(projectId, organizationId);

  // Nenhum outro marco pode depender deste antes de excluir - evita deixar
  // uma dependência apontando pra um marco que não existe mais em silêncio
  // (a FK já é ON DELETE SET NULL, mas isso apagaria a regra sem avisar).
  const dependents = await db.query.milestones.findFirst({
    where: eq(milestones.dependsOnMilestoneId, id),
    columns: { id: true },
  });
  if (dependents) {
    throw new Error("Outro marco depende deste. Remova a dependência antes de excluir.");
  }

  await db
    .delete(milestones)
    .where(and(eq(milestones.id, id), eq(milestones.projectId, projectId)));

  revalidatePath(`/crm/projetos/${projectId}`);
  return { success: true };
}
