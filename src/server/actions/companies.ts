"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { companies } from "../db/schema";

export async function getCompanies() {
  const { organizationId } = await requirePermission("companies.read");

  return await db.query.companies.findMany({
    where: eq(companies.organizationId, organizationId),
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
