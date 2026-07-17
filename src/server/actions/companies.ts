"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { companies } from "../db/schema";
import { auth } from "../auth";
import { headers } from "next/headers";

export async function getCompanies(organizationId: string) {
  return await db.query.companies.findMany({
    where: eq(companies.organizationId, organizationId),
    orderBy: (companies, { desc }) => [desc(companies.createdAt)],
  });
}

export async function createCompany(data: {
  organizationId: string;
  tradeName: string;
  legalName?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");

  const [company] = await db
    .insert(companies)
    .values({
      organizationId: data.organizationId,
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
