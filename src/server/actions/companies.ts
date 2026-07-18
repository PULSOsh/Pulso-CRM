"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { companies } from "../db/schema";
import { updateCompanySchema } from "./companies.schemas";

export async function getCompanies() {
  const { organizationId } = await requirePermission("companies.read");

  return await db.query.companies.findMany({
    where: and(eq(companies.organizationId, organizationId), isNull(companies.deletedAt)),
    orderBy: (companies, { desc }) => [desc(companies.createdAt)],
  });
}

export async function createCompany(data: {
  tradeName: string;
  legalName?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
}) {
  const { organizationId } = await requirePermission("companies.create");

  const [company] = await db
    .insert(companies)
    .values({
      organizationId,
      tradeName: data.tradeName,
      legalName: data.legalName,
      documentNumber: data.documentNumber,
      email: data.email,
      phone: data.phone,
      website: data.website,
    })
    .returning();

  revalidatePath("/crm/empresas");
  return company;
}

export async function updateCompany(companyId: string, input: unknown) {
  const { organizationId } = await requirePermission("companies.update");
  const parsed = updateCompanySchema.parse(input);

  const [updated] = await db
    .update(companies)
    .set({
      tradeName: parsed.tradeName,
      legalName: parsed.legalName,
      documentNumber: parsed.documentNumber,
      email: parsed.email,
      phone: parsed.phone,
      website: parsed.website,
      updatedAt: new Date(),
    })
    .where(and(eq(companies.id, companyId), eq(companies.organizationId, organizationId)))
    .returning({ id: companies.id });

  if (!updated) throw new Error("Empresa não encontrada.");

  revalidatePath("/crm/empresas");
  return { success: true };
}

export async function deleteCompany(companyId: string) {
  const { organizationId } = await requirePermission("companies.delete");

  const [updated] = await db
    .update(companies)
    .set({ deletedAt: new Date() })
    .where(and(eq(companies.id, companyId), eq(companies.organizationId, organizationId)))
    .returning({ id: companies.id });

  if (!updated) throw new Error("Empresa não encontrada.");

  revalidatePath("/crm/empresas");
  return { success: true };
}

export async function getDeletedCompanies() {
  const { organizationId } = await requirePermission("companies.restore");

  return await db.query.companies.findMany({
    where: and(eq(companies.organizationId, organizationId), isNotNull(companies.deletedAt)),
    orderBy: (companies, { desc }) => [desc(companies.deletedAt)],
  });
}

export async function restoreCompany(companyId: string) {
  const { organizationId } = await requirePermission("companies.restore");

  const [updated] = await db
    .update(companies)
    .set({ deletedAt: null })
    .where(and(eq(companies.id, companyId), eq(companies.organizationId, organizationId)))
    .returning({ id: companies.id });

  if (!updated) throw new Error("Empresa não encontrada.");

  revalidatePath("/crm/empresas");
  return { success: true };
}
