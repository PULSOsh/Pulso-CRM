"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { companies } from "../db/schema";
import { vendorSchema } from "./vendors.schemas";

/** CRM-F3-03: fornecedor reaproveita companies (isVendor) - uma empresa pode
 * ser cliente e fornecedor ao mesmo tempo, sem duplicar cadastro. */
export async function getVendors() {
  const { organizationId } = await requirePermission("companies.read");

  return db.query.companies.findMany({
    where: and(
      eq(companies.organizationId, organizationId),
      eq(companies.isVendor, true),
      isNull(companies.deletedAt),
    ),
    orderBy: [asc(companies.tradeName)],
  });
}

export async function createVendor(input: unknown) {
  const { organizationId, userId } = await requirePermission("vendors.manage");
  const parsed = vendorSchema.parse(input);

  const [vendor] = await db
    .insert(companies)
    .values({
      organizationId,
      ownerUserId: userId,
      tradeName: parsed.tradeName,
      documentNumber: parsed.documentNumber || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      isVendor: true,
    })
    .returning();

  revalidatePath("/crm/financeiro");
  return vendor;
}

/** Marca/desmarca uma empresa já cadastrada (cliente) como fornecedora
 * também, sem criar um segundo registro. */
export async function setCompanyVendorFlag(companyId: string, isVendor: boolean) {
  const { organizationId } = await requirePermission("vendors.manage");

  const [updated] = await db
    .update(companies)
    .set({ isVendor, updatedAt: new Date() })
    .where(and(eq(companies.id, companyId), eq(companies.organizationId, organizationId)))
    .returning({ id: companies.id });
  if (!updated) throw new Error("Empresa não encontrada.");

  revalidatePath("/crm/financeiro");
  revalidatePath("/crm/contatos");
  return { success: true };
}
