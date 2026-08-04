"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { companies } from "../db/schema";
import { csvToObjects } from "../services/csv";
import { normalizeDigits } from "../services/dedup";
import { importCompanyRowSchema, updateCompanySchema } from "./companies.schemas";
import type { ImportResult } from "./contacts";

export async function getCompanies() {
  const { organizationId } = await requirePermission("companies.read");

  return await db.query.companies.findMany({
    where: and(eq(companies.organizationId, organizationId), isNull(companies.deletedAt)),
    orderBy: (companies, { desc }) => [desc(companies.createdAt)],
  });
}

export async function createCompany(input: unknown) {
  const { organizationId } = await requirePermission("companies.create");
  const parsed = updateCompanySchema.parse(input);

  const [company] = await db
    .insert(companies)
    .values({
      organizationId,
      tradeName: parsed.tradeName,
      legalName: parsed.legalName,
      documentNumber: parsed.documentNumber,
      email: parsed.email,
      phone: parsed.phone,
      website: parsed.website,
    })
    .returning();

  revalidatePath("/crm/empresas");
  return company;
}

export async function importCompanies(csvText: string): Promise<ImportResult> {
  const { organizationId } = await requirePermission("companies.create");

  const rows = csvToObjects(csvText);
  if (rows.length === 0) throw new Error("CSV vazio ou sem linhas de dados.");
  if (rows.length > 1000) throw new Error("Máximo de 1000 linhas por importação.");

  const existingCompanies = await db.query.companies.findMany({
    where: and(eq(companies.organizationId, organizationId), isNull(companies.deletedAt)),
    columns: { tradeName: true, documentNumber: true },
  });
  const existingDocuments = new Set(
    existingCompanies.map((c) => normalizeDigits(c.documentNumber)).filter((v): v is string => !!v),
  );
  const existingNames = new Set(existingCompanies.map((c) => c.tradeName.trim().toLowerCase()));

  const seenDocuments = new Set<string>();
  const seenNames = new Set<string>();
  const duplicates: ImportResult["duplicates"] = [];
  const invalid: ImportResult["invalid"] = [];
  const toInsert: (typeof companies.$inferInsert)[] = [];

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const parsed = importCompanyRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      invalid.push({ row: rowNumber, error: parsed.error.issues[0]?.message ?? "Linha inválida." });
      return;
    }
    const data = parsed.data;
    const document = normalizeDigits(data.cnpj);
    const name = data.nomeFantasia.trim().toLowerCase();

    if (document && (existingDocuments.has(document) || seenDocuments.has(document))) {
      duplicates.push({ row: rowNumber, reason: `CNPJ já cadastrado: ${data.cnpj}` });
      return;
    }
    if (!document && (existingNames.has(name) || seenNames.has(name))) {
      duplicates.push({ row: rowNumber, reason: `Nome fantasia já cadastrado: ${data.nomeFantasia}` });
      return;
    }
    if (document) seenDocuments.add(document);
    seenNames.add(name);

    toInsert.push({
      organizationId,
      tradeName: data.nomeFantasia,
      legalName: data.razaoSocial || null,
      documentNumber: data.cnpj || null,
      email: data.email || null,
      phone: data.telefone || null,
      website: data.site || null,
    });
  });

  if (toInsert.length > 0) {
    await db.insert(companies).values(toInsert);
  }

  revalidatePath("/crm/empresas");
  return { created: toInsert.length, duplicates, invalid };
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
