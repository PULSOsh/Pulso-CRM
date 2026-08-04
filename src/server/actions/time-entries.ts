"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { projects, timeEntries } from "../db/schema";
import { logTimeSchema } from "./time-entries.schemas";

export async function getTimeEntriesForProject(projectId: string) {
  const { organizationId } = await requirePermission("projects.read");

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
    columns: { id: true },
  });
  if (!project) throw new Error("Projeto não encontrado.");

  return db.query.timeEntries.findMany({
    where: eq(timeEntries.projectId, projectId),
    orderBy: [desc(timeEntries.workDate)],
  });
}

export async function logTime(projectId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("projects.update");
  const parsed = logTimeSchema.parse(input);

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)),
    columns: { id: true },
  });
  if (!project) throw new Error("Projeto não encontrado.");

  const [entry] = await db
    .insert(timeEntries)
    .values({
      organizationId,
      projectId,
      userId,
      workDate: new Date(parsed.workDate),
      hours: parsed.hours.toString(),
      description: parsed.description || null,
    })
    .returning();

  revalidatePath(`/crm/projetos/${projectId}`);
  return entry;
}

export async function deleteTimeEntry(entryId: string, projectId: string) {
  const { organizationId, userId } = await requirePermission("projects.update");

  const entry = await db.query.timeEntries.findFirst({
    where: and(eq(timeEntries.id, entryId), eq(timeEntries.projectId, projectId)),
  });
  if (!entry) throw new Error("Apontamento não encontrado.");
  if (entry.organizationId !== organizationId) throw new Error("Apontamento não encontrado.");
  // Só o autor do apontamento pode excluí-lo - evita que alguém apague horas
  // lançadas por outro colega sem essa permissão adicional (nenhuma role
  // hoje distingue "editar horas de terceiros", então o padrão seguro é
  // restringir ao próprio autor).
  if (entry.userId !== userId) throw new Error("Você só pode excluir seus próprios apontamentos.");

  await db.delete(timeEntries).where(eq(timeEntries.id, entryId));

  revalidatePath(`/crm/projetos/${projectId}`);
  return { success: true };
}
