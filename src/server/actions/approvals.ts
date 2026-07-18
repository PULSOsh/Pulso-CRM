"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { approvals, projects } from "../db/schema";
import { logActivity } from "../services/activity-log";

export async function createApprovalRequest(
  projectId: string,
  data: { title: string; description?: string },
) {
  const { organizationId, userId } = await requirePermission("approvals.create");

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
  });
  if (!project) throw new Error("Projeto não encontrado.");

  const [approval] = await db
    .insert(approvals)
    .values({
      organizationId,
      projectId,
      title: data.title,
      description: data.description,
      status: "pending",
    })
    .returning();

  if (project.opportunityId) {
    await logActivity({
      organizationId,
      actorUserId: userId,
      type: "system",
      title: `Aprovação solicitada: ${data.title}`,
      opportunityId: project.opportunityId,
    });
  }

  revalidatePath(`/crm/projetos/${projectId}`);
  return approval;
}

export async function getApprovalsForProject(projectId: string) {
  const { organizationId } = await requirePermission("approvals.read");

  return db.query.approvals.findMany({
    where: and(eq(approvals.organizationId, organizationId), eq(approvals.projectId, projectId)),
    orderBy: [desc(approvals.requestedAt)],
  });
}

export async function cancelApprovalRequest(id: string) {
  const { organizationId } = await requirePermission("approvals.create");

  const approval = await db.query.approvals.findFirst({
    where: and(eq(approvals.id, id), eq(approvals.organizationId, organizationId)),
  });
  if (!approval) throw new Error("Aprovação não encontrada.");
  if (approval.status !== "pending") {
    throw new Error("Só é possível cancelar uma aprovação pendente.");
  }

  await db.update(approvals).set({ status: "cancelled" }).where(eq(approvals.id, id));

  revalidatePath(`/crm/projetos/${approval.projectId}`);
  return { success: true };
}
