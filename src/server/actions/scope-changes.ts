"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { projectScopeChanges, projects } from "../db/schema";
import { logActivity } from "../services/activity-log";
import { writeAuditLog } from "../services/audit-log";
import { decideScopeChangeSchema, requestScopeChangeSchema } from "./scope-changes.schemas";

async function findOwnedProject(projectId: string, organizationId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
  });
  if (!project) throw new Error("Projeto não encontrado.");
  return project;
}

export async function getScopeChangesForProject(projectId: string) {
  const { organizationId } = await requirePermission("projects.read");
  await findOwnedProject(projectId, organizationId);

  return db.query.projectScopeChanges.findMany({
    where: eq(projectScopeChanges.projectId, projectId),
    orderBy: [desc(projectScopeChanges.createdAt)],
  });
}

export async function requestScopeChange(projectId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("projects.update");
  await findOwnedProject(projectId, organizationId);
  const parsed = requestScopeChangeSchema.parse(input);

  const [scopeChange] = await db
    .insert(projectScopeChanges)
    .values({
      organizationId,
      projectId,
      title: parsed.title,
      description: parsed.description || null,
      valueDelta: parsed.valueDelta.toFixed(2),
      deadlineDeltaDays: parsed.deadlineDeltaDays,
      requestedBy: userId,
    })
    .returning();

  revalidatePath(`/crm/projetos/${projectId}`);
  return scopeChange;
}

/**
 * Alteração de preço/prazo registra evento (docs/PRODUCT_VISION.md
 * "histórico confiável") - aprovar uma alteração de escopo não só marca o
 * status, também ajusta projects.totalValue/dueDate de verdade, dentro de
 * uma transação, com activity + audit log. Rejeitar só marca o status, sem
 * tocar no projeto.
 */
export async function decideScopeChange(id: string, projectId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("projects.update");
  const project = await findOwnedProject(projectId, organizationId);
  const parsed = decideScopeChangeSchema.parse(input);

  const scopeChange = await db.query.projectScopeChanges.findFirst({
    where: and(eq(projectScopeChanges.id, id), eq(projectScopeChanges.projectId, projectId)),
  });
  if (!scopeChange) throw new Error("Alteração de escopo não encontrada.");
  if (scopeChange.status !== "pending") {
    throw new Error("Esta alteração de escopo já foi decidida.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(projectScopeChanges)
      .set({
        status: parsed.approved ? "approved" : "rejected",
        decidedAt: new Date(),
        decidedBy: userId,
        decisionNotes: parsed.notes || null,
      })
      .where(eq(projectScopeChanges.id, id));

    if (parsed.approved) {
      const newDueDate =
        scopeChange.deadlineDeltaDays && project.dueDate
          ? new Date(project.dueDate.getTime() + scopeChange.deadlineDeltaDays * 86_400_000)
          : project.dueDate;

      await tx
        .update(projects)
        .set({
          totalValue: sql`${projects.totalValue} + ${scopeChange.valueDelta}`,
          dueDate: newDueDate,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      if (project.opportunityId) {
        await logActivity(
          {
            organizationId,
            actorUserId: userId,
            type: "system",
            title: `Alteração de escopo aprovada: ${scopeChange.title}`,
            body: `Impacto: ${scopeChange.valueDelta} no valor${
              scopeChange.deadlineDeltaDays ? `, ${scopeChange.deadlineDeltaDays} dia(s) no prazo` : ""
            }`,
            opportunityId: project.opportunityId,
          },
          tx,
        );
      }
    }

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: parsed.approved ? "project.scope_change.approved" : "project.scope_change.rejected",
        entityType: "project_scope_change",
        entityId: id,
        before: { status: "pending" },
        after: { status: parsed.approved ? "approved" : "rejected" },
      },
      tx,
    );
  });

  revalidatePath(`/crm/projetos/${projectId}`);
  return { success: true };
}
