"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { personalCategories } from "../db/schema";
import { requirePersonalAccess } from "../services/personal-workspace";
import { personalCategorySchema } from "./personal-categories.schemas";

export async function getPersonalCategories() {
  const { organizationId } = await requirePersonalAccess("read");

  return db.query.personalCategories.findMany({
    where: and(
      eq(personalCategories.organizationId, organizationId),
      eq(personalCategories.isActive, true),
    ),
    orderBy: [asc(personalCategories.name)],
  });
}

export async function createPersonalCategory(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalCategorySchema.parse(input);

  const existing = await db.query.personalCategories.findFirst({
    where: and(
      eq(personalCategories.organizationId, organizationId),
      eq(personalCategories.name, parsed.name),
      eq(personalCategories.kind, parsed.kind),
    ),
  });
  if (existing) throw new Error("Já existe uma categoria com este nome e tipo.");

  const [category] = await db
    .insert(personalCategories)
    .values({ organizationId, name: parsed.name, kind: parsed.kind })
    .returning();

  revalidatePath("/crm/pessoal");
  return category;
}

export async function deactivatePersonalCategory(id: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const [updated] = await db
    .update(personalCategories)
    .set({ isActive: false })
    .where(
      and(eq(personalCategories.id, id), eq(personalCategories.organizationId, organizationId)),
    )
    .returning({ id: personalCategories.id });
  if (!updated) throw new Error("Categoria não encontrada.");

  revalidatePath("/crm/pessoal");
  return { success: true };
}
