"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { knowledgeArticles } from "../db/schema";
import { slugify } from "../services/slug";
import { knowledgeArticleSchema } from "./knowledge.schemas";

async function uniqueSlug(organizationId: string, title: string, excludeId?: string) {
  const base = slugify(title) || "artigo";
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const existing = await db.query.knowledgeArticles.findFirst({
      where: and(
        eq(knowledgeArticles.organizationId, organizationId),
        eq(knowledgeArticles.slug, candidate),
      ),
      columns: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function getKnowledgeArticles() {
  const { organizationId } = await requirePermission("knowledge.read");

  return db.query.knowledgeArticles.findMany({
    where: eq(knowledgeArticles.organizationId, organizationId),
    orderBy: [desc(knowledgeArticles.updatedAt)],
  });
}

export async function createKnowledgeArticle(input: unknown) {
  const { organizationId, userId } = await requirePermission("knowledge.manage");
  const parsed = knowledgeArticleSchema.parse(input);
  const slug = await uniqueSlug(organizationId, parsed.title);

  const [article] = await db
    .insert(knowledgeArticles)
    .values({
      organizationId,
      title: parsed.title,
      slug,
      body: parsed.body,
      category: parsed.category || null,
      createdBy: userId,
    })
    .returning();

  revalidatePath("/crm/base-de-conhecimento");
  return article;
}

export async function updateKnowledgeArticle(id: string, input: unknown) {
  const { organizationId } = await requirePermission("knowledge.manage");
  const parsed = knowledgeArticleSchema.parse(input);

  const existing = await db.query.knowledgeArticles.findFirst({
    where: and(eq(knowledgeArticles.id, id), eq(knowledgeArticles.organizationId, organizationId)),
  });
  if (!existing) throw new Error("Artigo não encontrado.");

  const slug =
    existing.title === parsed.title
      ? existing.slug
      : await uniqueSlug(organizationId, parsed.title, id);

  await db
    .update(knowledgeArticles)
    .set({
      title: parsed.title,
      slug,
      body: parsed.body,
      category: parsed.category || null,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeArticles.id, id));

  revalidatePath("/crm/base-de-conhecimento");
  revalidatePath("/ajuda");
  return { success: true };
}

export async function publishKnowledgeArticle(id: string) {
  const { organizationId } = await requirePermission("knowledge.manage");

  const [updated] = await db
    .update(knowledgeArticles)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(knowledgeArticles.id, id), eq(knowledgeArticles.organizationId, organizationId)))
    .returning({ id: knowledgeArticles.id });
  if (!updated) throw new Error("Artigo não encontrado.");

  revalidatePath("/crm/base-de-conhecimento");
  revalidatePath("/ajuda");
  return { success: true };
}

export async function unpublishKnowledgeArticle(id: string) {
  const { organizationId } = await requirePermission("knowledge.manage");

  const [updated] = await db
    .update(knowledgeArticles)
    .set({ status: "draft", updatedAt: new Date() })
    .where(and(eq(knowledgeArticles.id, id), eq(knowledgeArticles.organizationId, organizationId)))
    .returning({ id: knowledgeArticles.id });
  if (!updated) throw new Error("Artigo não encontrado.");

  revalidatePath("/crm/base-de-conhecimento");
  revalidatePath("/ajuda");
  return { success: true };
}

/** Pública (CRM-F5-03) - central de ajuda, sem token nem sessão: conteúdo de
 * apoio, não dado de cliente específico, publicado deliberadamente para
 * consulta livre (mesma lógica de uma página de FAQ institucional). Resolve
 * a única organização do sistema (CLAUDE.md §4: single-workspace), mesmo
 * padrão já usado em `seed-templates.ts`. */
async function resolveSoleOrganizationId(): Promise<string | null> {
  const organization = await db.query.organizations.findFirst({ columns: { id: true } });
  return organization?.id ?? null;
}

export async function getPublishedKnowledgeArticles() {
  const organizationId = await resolveSoleOrganizationId();
  if (!organizationId) return [];

  return db.query.knowledgeArticles.findMany({
    where: and(
      eq(knowledgeArticles.organizationId, organizationId),
      eq(knowledgeArticles.status, "published"),
    ),
    orderBy: [asc(knowledgeArticles.title)],
  });
}

export async function getPublishedKnowledgeArticleBySlug(slug: string) {
  const organizationId = await resolveSoleOrganizationId();
  if (!organizationId) return null;

  return db.query.knowledgeArticles.findFirst({
    where: and(
      eq(knowledgeArticles.organizationId, organizationId),
      eq(knowledgeArticles.slug, slug),
      eq(knowledgeArticles.status, "published"),
    ),
  });
}
