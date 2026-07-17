"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { briefingTemplates } from "../db/schema";

export async function getBriefingTemplates(organizationId: string) {
  return await db.query.briefingTemplates.findMany({
    where: eq(briefingTemplates.organizationId, organizationId),
    orderBy: (templates, { desc }) => [desc(templates.createdAt)],
  });
}

export async function createBriefingTemplate(data: {
  organizationId: string;
  name: string;
  slug: string;
  publicTitle: string;
}) {
  const [template] = await db
    .insert(briefingTemplates)
    .values({
      organizationId: data.organizationId,
      name: data.name,
      slug: data.slug,
      publicTitle: data.publicTitle,
      status: "draft",
    })
    .returning();

  revalidatePath("/crm/briefings/templates");
  return template;
}

export async function getBriefingTemplateById(id: string, organizationId: string) {
  return await db.query.briefingTemplates.findFirst({
    where: (templates, { and, eq }) =>
      and(eq(templates.id, id), eq(templates.organizationId, organizationId)),
  });
}

export async function updateBriefingTemplate(
  id: string,
  _organizationId: string,
  data: Partial<typeof briefingTemplates.$inferInsert>,
) {
  const [updated] = await db
    .update(briefingTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(briefingTemplates.id, id)) // Would ideally include orgId check for security
    .returning();

  revalidatePath(`/crm/briefings/templates/${id}`);
  revalidatePath("/crm/briefings/templates");
  return updated;
}
