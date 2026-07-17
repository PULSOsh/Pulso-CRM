"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { briefingTemplates } from "../db/schema";

export async function getBriefingTemplates() {
  const { organizationId } = await requirePermission("briefings.read");

  return await db.query.briefingTemplates.findMany({
    where: eq(briefingTemplates.organizationId, organizationId),
    orderBy: (templates, { desc }) => [desc(templates.createdAt)],
  });
}

export async function createBriefingTemplate(data: {
  name: string;
  slug: string;
  publicTitle: string;
}) {
  const { organizationId } = await requirePermission("briefings.manage_templates");

  const [template] = await db
    .insert(briefingTemplates)
    .values({
      organizationId,
      name: data.name,
      slug: data.slug,
      publicTitle: data.publicTitle,
      status: "draft",
    })
    .returning();

  revalidatePath("/crm/briefings/templates");
  return template;
}

export async function getBriefingTemplateById(id: string) {
  const { organizationId } = await requirePermission("briefings.read");

  return await db.query.briefingTemplates.findFirst({
    where: (templates, { and, eq }) =>
      and(eq(templates.id, id), eq(templates.organizationId, organizationId)),
  });
}

export async function updateBriefingTemplate(
  id: string,
  data: Partial<typeof briefingTemplates.$inferInsert>,
) {
  const { organizationId } = await requirePermission("briefings.manage_templates");

  const [updated] = await db
    .update(briefingTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(briefingTemplates.id, id), eq(briefingTemplates.organizationId, organizationId)))
    .returning();

  revalidatePath(`/crm/briefings/templates/${id}`);
  revalidatePath("/crm/briefings/templates");
  return updated;
}
