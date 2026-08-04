"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { projectTemplateChecklistItems, projectTemplates } from "../db/schema";
import { projectTemplateSchema } from "./project-templates.schemas";

export async function getProjectTemplates() {
  const { organizationId } = await requirePermission("projects.read");

  const templates = await db.query.projectTemplates.findMany({
    where: and(eq(projectTemplates.organizationId, organizationId), eq(projectTemplates.isActive, true)),
    orderBy: [asc(projectTemplates.name)],
  });

  const checklists = await Promise.all(
    templates.map((template) =>
      db.query.projectTemplateChecklistItems.findMany({
        where: eq(projectTemplateChecklistItems.templateId, template.id),
        orderBy: [asc(projectTemplateChecklistItems.position)],
      }),
    ),
  );

  return templates.map((template, index) => ({
    ...template,
    checklistItems: checklists[index],
  }));
}

export async function createProjectTemplate(input: unknown) {
  const { organizationId } = await requirePermission("projects.create");
  const parsed = projectTemplateSchema.parse(input);

  const [template] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(projectTemplates)
      .values({
        organizationId,
        name: parsed.name,
        description: parsed.description || null,
      })
      .returning();

    if (parsed.checklistTitles.length > 0) {
      await tx.insert(projectTemplateChecklistItems).values(
        parsed.checklistTitles.map((title, index) => ({
          templateId: created.id,
          title,
          position: index,
        })),
      );
    }

    return [created];
  });

  revalidatePath("/crm/projetos");
  return template;
}

export async function deleteProjectTemplate(id: string) {
  const { organizationId } = await requirePermission("projects.create");

  const [updated] = await db
    .update(projectTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(projectTemplates.id, id), eq(projectTemplates.organizationId, organizationId)))
    .returning({ id: projectTemplates.id });

  if (!updated) throw new Error("Template não encontrado.");

  revalidatePath("/crm/projetos");
  return { success: true };
}
