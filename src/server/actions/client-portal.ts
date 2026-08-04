"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { approvals, milestones, projects } from "../db/schema";
import { logActivity } from "../services/activity-log";
import { notifyUser } from "../services/notify";
import { writeAuditLog } from "../services/audit-log";
import { getPublicFilesForEntity } from "./files";
import { closeProjectSchema, submitSatisfactionSchema } from "./client-portal.schemas";

export async function enableClientPortal(projectId: string) {
  const { organizationId } = await requirePermission("projects.update");

  const [updated] = await db
    .update(projects)
    .set({ clientPortalEnabled: true, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
    .returning({ clientPortalToken: projects.clientPortalToken });

  if (!updated) throw new Error("Projeto não encontrado.");

  revalidatePath(`/crm/projetos/${projectId}`);
  return { token: updated.clientPortalToken };
}

export async function disableClientPortal(projectId: string) {
  const { organizationId } = await requirePermission("projects.update");

  const [updated] = await db
    .update(projects)
    .set({ clientPortalEnabled: false, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
    .returning({ id: projects.id });

  if (!updated) throw new Error("Projeto não encontrado.");

  revalidatePath(`/crm/projetos/${projectId}`);
  return { success: true };
}

/**
 * Página pública do portal do cliente (CRM-F2-07). Mesmo padrão de token
 * revogável já usado em proposta/contrato/aprovação - sem conta de cliente
 * com login. Retorna só o que o cliente deve ver: status de entrega, marcos,
 * arquivos marcados públicos, aprovações. Nunca expõe valor financeiro
 * interno (margem/custo) nem notas internas de encerramento.
 */
export async function getClientPortalProject(token: string) {
  if (!token) return null;

  const project = await db.query.projects.findFirst({
    where: eq(projects.clientPortalToken, token),
  });
  if (!project?.clientPortalEnabled) return null;

  const [projectMilestones, projectApprovals, files] = await Promise.all([
    db.query.milestones.findMany({
      where: eq(milestones.projectId, project.id),
      orderBy: (t, { asc }) => [asc(t.position)],
      columns: { id: true, title: true, dueDate: true, isCompleted: true },
    }),
    db.query.approvals.findMany({
      where: eq(approvals.projectId, project.id),
      columns: { id: true, title: true, status: true, requestedAt: true, decidedAt: true },
    }),
    getPublicFilesForEntity(project.organizationId, "project", project.id),
  ]);

  return {
    name: project.name,
    description: project.description,
    status: project.status,
    progress: project.progress,
    startDate: project.startDate,
    dueDate: project.dueDate,
    completedAt: project.completedAt,
    satisfactionRequestedAt: project.satisfactionRequestedAt,
    satisfactionRespondedAt: project.satisfactionRespondedAt,
    milestones: projectMilestones,
    approvals: projectApprovals,
    files,
  };
}

/**
 * Encerramento (CRM-F2-08): marca o projeto como concluído e já solicita a
 * satisfação do cliente (satisfactionRequestedAt), reaproveitando o mesmo
 * token do portal em vez de criar um mecanismo de envio separado - o
 * responsável compartilha o link do portal com o cliente (mesmo padrão
 * manual já estabelecido pra propostas/contratos, sem envio de e-mail
 * automático).
 */
export async function closeProject(projectId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("projects.complete");
  const parsed = closeProjectSchema.parse(input);

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
  });
  if (!project) throw new Error("Projeto não encontrado.");
  if (project.status === "completed") throw new Error("Este projeto já está encerrado.");

  await db.transaction(async (tx) => {
    await tx
      .update(projects)
      .set({
        status: "completed",
        completedAt: new Date(),
        closedNotes: parsed.notes || null,
        satisfactionRequestedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    if (project.opportunityId) {
      await logActivity(
        {
          organizationId,
          actorUserId: userId,
          type: "system",
          title: `Projeto encerrado: ${project.name}`,
          opportunityId: project.opportunityId,
        },
        tx,
      );
    }

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "project.closed",
        entityType: "project",
        entityId: projectId,
        before: { status: project.status },
        after: { status: "completed" },
      },
      tx,
    );
  });

  revalidatePath(`/crm/projetos/${projectId}`);
  revalidatePath("/crm/projetos");
  return { success: true };
}

export async function submitSatisfaction(token: string, input: unknown) {
  if (!token) return { success: false, error: "Portal inválido." };
  const parsed = submitSatisfactionSchema.parse(input);

  const project = await db.query.projects.findFirst({
    where: eq(projects.clientPortalToken, token),
  });
  if (!project?.clientPortalEnabled) {
    return { success: false, error: "Portal inválido." };
  }
  if (!project.satisfactionRequestedAt) {
    return { success: false, error: "A avaliação ainda não foi solicitada para este projeto." };
  }
  if (project.satisfactionRespondedAt) {
    return { success: false, error: "Este projeto já foi avaliado." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(projects)
      .set({
        satisfactionScore: parsed.score,
        satisfactionComment: parsed.comment || null,
        satisfactionRespondedAt: new Date(),
      })
      .where(eq(projects.id, project.id));

    await writeAuditLog(
      {
        organizationId: project.organizationId,
        actorUserId: null,
        action: "project.satisfaction_submitted",
        entityType: "project",
        entityId: project.id,
        after: { score: parsed.score },
      },
      tx,
    );

    if (project.ownerUserId) {
      await notifyUser(
        {
          organizationId: project.organizationId,
          userId: project.ownerUserId,
          type: "project.satisfaction_submitted",
          title: `Avaliação recebida: ${project.name} (nota ${parsed.score}/5)`,
          actionUrl: `/crm/projetos/${project.id}`,
        },
        tx,
      );
    }
  });

  revalidatePath(`/crm/projetos/${project.id}`);
  return { success: true };
}
