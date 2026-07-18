"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "../db/connection";
import { approvals, projects, tasks } from "../db/schema";
import { logActivity } from "../services/activity-log";
import { writeAuditLog } from "../services/audit-log";
import { notifyUser } from "../services/notify";
import { getPublicFilesForEntity } from "./files";

export async function getPublicApproval(token: string) {
  if (!token) return null;

  const approval = await db.query.approvals.findFirst({
    where: eq(approvals.publicToken, token),
  });
  if (!approval) return null;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, approval.projectId),
  });

  const files = await getPublicFilesForEntity(approval.organizationId, "approval", approval.id);

  return {
    title: approval.title,
    description: approval.description,
    status: approval.status,
    requestedAt: approval.requestedAt,
    decidedAt: approval.decidedAt,
    decisionNotes: approval.decisionNotes,
    projectName: project?.name ?? null,
    files,
  };
}

type Decision = "approved" | "approved_with_notes" | "rejected";

export async function decideApproval(
  token: string,
  decision: Decision,
  data: { name: string; email?: string; comment?: string },
) {
  if (!token) return { success: false, error: "Aprovação inválida." };

  const approval = await db.query.approvals.findFirst({
    where: eq(approvals.publicToken, token),
  });
  if (approval?.status !== "pending") {
    return { success: false, error: "Aprovação inválida ou já decidida." };
  }
  if (decision === "approved_with_notes" && !data.comment?.trim()) {
    return { success: false, error: "Descreva a observação." };
  }
  if (decision === "rejected" && !data.comment?.trim()) {
    return { success: false, error: "Descreva o que precisa ser ajustado." };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = requestHeaders.get("user-agent") ?? undefined;

  await db.transaction(async (tx) => {
    await tx
      .update(approvals)
      .set({
        status: decision,
        decidedAt: new Date(),
        decidedByName: data.name,
        decisionNotes: data.comment,
        evidence: {
          name: data.name,
          email: data.email ?? null,
          comment: data.comment ?? null,
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          decidedAt: new Date().toISOString(),
        },
      })
      .where(eq(approvals.id, approval.id));

    const project = await tx.query.projects.findFirst({
      where: eq(projects.id, approval.projectId),
    });

    if (decision === "rejected" && project) {
      await tx.insert(tasks).values({
        organizationId: approval.organizationId,
        projectId: approval.projectId,
        assignedTo: project.ownerUserId,
        title: `Ajustar conforme solicitado: ${approval.title}`,
        description: data.comment,
        priority: "high",
      });
    }

    const label =
      decision === "approved"
        ? "aprovada"
        : decision === "rejected"
          ? "rejeitada"
          : "aprovada com observações";

    if (project?.opportunityId) {
      await logActivity(
        {
          organizationId: approval.organizationId,
          actorUserId: null,
          type: "system",
          title: `Aprovação ${label} pelo cliente: ${approval.title}`,
          opportunityId: project.opportunityId,
        },
        tx,
      );
    }

    if (project?.ownerUserId) {
      await notifyUser(
        {
          organizationId: approval.organizationId,
          userId: project.ownerUserId,
          type: `approval.${decision}`,
          title: `Aprovação ${label}: ${approval.title}`,
          actionUrl: `/crm/projetos/${approval.projectId}`,
        },
        tx,
      );
    }

    await writeAuditLog(
      {
        organizationId: approval.organizationId,
        actorUserId: null,
        action: `approval.${decision}`,
        entityType: "approval",
        entityId: approval.id,
        before: { status: "pending" },
        after: { status: decision, decidedByName: data.name },
        ipAddress: ip,
        userAgent,
      },
      tx,
    );
  });

  return { success: true };
}
