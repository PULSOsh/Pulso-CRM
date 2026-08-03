"use server";

import { and, eq, gte, lt, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { taskRecurrences, tasks } from "../db/schema";
import { logActivity } from "../services/activity-log";
import { writeAuditLog } from "../services/audit-log";
import { calculateNextDueDate } from "../services/recurrence";
import {
  createTaskSchema,
  reopenTaskSchema,
  type TaskRecurrenceInput,
  taskRecurrenceSchema,
} from "./tasks.schemas";

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

export async function getCompletedTasks() {
  const { organizationId, userId } = await requirePermission("tasks.read");

  return await db.query.tasks.findMany({
    where: and(
      eq(tasks.organizationId, organizationId),
      eq(tasks.assignedTo, userId),
      eq(tasks.status, "done"),
    ),
    orderBy: (tasksTable, { desc }) => [desc(tasksTable.completedAt)],
    with: { opportunity: { columns: { title: true } } },
  });
}

export async function completeTask(taskId: string) {
  const { organizationId, userId } = await requirePermission("tasks.complete");

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(tasks)
      .set({ status: "done", completedAt: new Date(), completedBy: userId, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)))
      .returning();

    if (!updated) throw new Error("Tarefa não encontrada.");

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "task.completed",
        entityType: "task",
        entityId: taskId,
        after: { status: "done" },
      },
      tx,
    );

    if (updated.opportunityId) {
      await logActivity(
        {
          organizationId,
          actorUserId: userId,
          type: "task",
          title: `Tarefa concluída: ${updated.title}`,
          opportunityId: updated.opportunityId,
        },
        tx,
      );
    }

    // Recorrência (CRM-F0-06): se a tarefa concluída tinha uma regra ativa e a
    // próxima data não passa da data-limite (se houver), gera a próxima
    // ocorrência automaticamente e move a regra pra apontar pra ela.
    const recurrence = await tx.query.taskRecurrences.findFirst({
      where: eq(taskRecurrences.taskId, taskId),
    });

    if (recurrence) {
      const nextDueAt = calculateNextDueDate(
        updated.dueAt ?? new Date(),
        recurrence.frequency,
        recurrence.interval,
      );
      const pastLimit = recurrence.until && nextDueAt.getTime() > recurrence.until.getTime();

      if (!pastLimit) {
        const [nextTask] = await tx
          .insert(tasks)
          .values({
            organizationId,
            createdBy: updated.createdBy,
            assignedTo: updated.assignedTo,
            title: updated.title,
            description: updated.description,
            priority: updated.priority,
            dueAt: nextDueAt,
            opportunityId: updated.opportunityId,
            companyId: updated.companyId,
            contactId: updated.contactId,
            projectId: updated.projectId,
          })
          .returning({ id: tasks.id });

        await tx
          .update(taskRecurrences)
          .set({ taskId: nextTask.id, updatedAt: new Date() })
          .where(eq(taskRecurrences.id, recurrence.id));
      }
    }
  });

  revalidatePath("/crm/tarefas");
  revalidatePath("/crm/pipeline");
  return { success: true };
}

export async function setTaskRecurrence(taskId: string, input: unknown) {
  const { organizationId } = await requirePermission("tasks.update");
  const parsed: TaskRecurrenceInput = taskRecurrenceSchema.parse(input);

  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)),
    columns: { id: true },
  });
  if (!task) throw new Error("Tarefa não encontrada.");

  await db
    .insert(taskRecurrences)
    .values({
      organizationId,
      taskId,
      frequency: parsed.frequency,
      interval: parsed.interval,
      until: parsed.until ? new Date(parsed.until) : null,
    })
    .onConflictDoUpdate({
      target: taskRecurrences.taskId,
      set: {
        frequency: parsed.frequency,
        interval: parsed.interval,
        until: parsed.until ? new Date(parsed.until) : null,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/crm/tarefas");
  return { success: true };
}

export async function clearTaskRecurrence(taskId: string) {
  const { organizationId } = await requirePermission("tasks.update");

  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)),
    columns: { id: true },
  });
  if (!task) throw new Error("Tarefa não encontrada.");

  await db.delete(taskRecurrences).where(eq(taskRecurrences.taskId, taskId));

  revalidatePath("/crm/tarefas");
  return { success: true };
}

export async function getTasksForMonth(gridStart: string, gridEnd: string) {
  const { organizationId, userId } = await requirePermission("tasks.read");

  return await db.query.tasks.findMany({
    where: and(
      eq(tasks.organizationId, organizationId),
      eq(tasks.assignedTo, userId),
      eq(tasks.status, "todo"),
      gte(tasks.dueAt, new Date(gridStart)),
      lte(tasks.dueAt, new Date(gridEnd)),
    ),
    orderBy: (tasksTable, { asc }) => [asc(tasksTable.dueAt)],
  });
}

export async function reopenTask(taskId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("tasks.complete");
  const parsed = reopenTaskSchema.parse(input);

  const [updated] = await db
    .update(tasks)
    .set({ status: "todo", completedAt: null, completedBy: null, updatedAt: new Date() })
    .where(
      and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId), eq(tasks.status, "done")),
    )
    .returning({ id: tasks.id, title: tasks.title, opportunityId: tasks.opportunityId });

  if (!updated) throw new Error("Tarefa não encontrada ou não está concluída.");

  await writeAuditLog({
    organizationId,
    actorUserId: userId,
    action: "task.reopened",
    entityType: "task",
    entityId: taskId,
    after: { status: "todo", reason: parsed.reason },
  });

  if (updated.opportunityId) {
    await logActivity({
      organizationId,
      actorUserId: userId,
      type: "task",
      title: `Tarefa reaberta: ${updated.title}`,
      body: parsed.reason,
      opportunityId: updated.opportunityId,
    });
  }

  revalidatePath("/crm/tarefas");
  revalidatePath("/crm/pipeline");
  return { success: true };
}
