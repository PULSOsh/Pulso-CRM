"use server";

import { and, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { tasks } from "../db/schema";
import { logActivity } from "../services/activity-log";
import { createTaskSchema } from "./tasks.schemas";

export async function createTask(input: unknown) {
  const { organizationId, userId } = await requirePermission("tasks.create");
  const parsed = createTaskSchema.parse(input);

  const [task] = await db
    .insert(tasks)
    .values({
      organizationId,
      createdBy: userId,
      assignedTo: parsed.assignedTo ?? userId,
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority ?? "normal",
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : undefined,
      opportunityId: parsed.opportunityId,
      companyId: parsed.companyId,
      contactId: parsed.contactId,
    })
    .returning();

  if (parsed.opportunityId) {
    await logActivity({
      organizationId,
      actorUserId: userId,
      type: "task",
      title: `Tarefa criada: ${parsed.title}`,
      opportunityId: parsed.opportunityId,
    });
  }

  revalidatePath("/crm/tarefas");
  return task;
}

export async function getMyTasks() {
  const { organizationId, userId } = await requirePermission("tasks.read");

  return await db.query.tasks.findMany({
    where: and(
      eq(tasks.organizationId, organizationId),
      eq(tasks.assignedTo, userId),
      eq(tasks.status, "todo"),
    ),
    orderBy: (tasksTable, { asc }) => [asc(tasksTable.dueAt)],
    with: { opportunity: { columns: { title: true } } },
  });
}

export async function getOverdueTasks() {
  const { organizationId, userId } = await requirePermission("tasks.read");

  return await db.query.tasks.findMany({
    where: and(
      eq(tasks.organizationId, organizationId),
      eq(tasks.assignedTo, userId),
      eq(tasks.status, "todo"),
      lt(tasks.dueAt, new Date()),
    ),
    orderBy: (tasksTable, { asc }) => [asc(tasksTable.dueAt)],
    with: { opportunity: { columns: { title: true } } },
  });
}

export async function completeTask(taskId: string) {
  const { organizationId } = await requirePermission("tasks.complete");

  const [updated] = await db
    .update(tasks)
    .set({ status: "done", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)))
    .returning({ id: tasks.id });

  if (!updated) throw new Error("Tarefa não encontrada.");

  revalidatePath("/crm/tarefas");
  return { success: true };
}
