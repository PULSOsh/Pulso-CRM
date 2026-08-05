"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { personalAccounts } from "../db/schema";
import { requirePersonalAccess } from "../services/personal-workspace";
import { personalAccountSchema } from "./personal-accounts.schemas";

export async function getPersonalAccounts() {
  const { organizationId } = await requirePersonalAccess("read");

  return db.query.personalAccounts.findMany({
    where: eq(personalAccounts.organizationId, organizationId),
    orderBy: [asc(personalAccounts.name)],
  });
}

export async function createPersonalAccount(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalAccountSchema.parse(input);

  const [account] = await db
    .insert(personalAccounts)
    .values({
      organizationId,
      name: parsed.name,
      accountType: parsed.accountType || null,
      institution: parsed.institution || null,
    })
    .returning();

  revalidatePath("/crm/pessoal");
  return account;
}

export async function deactivatePersonalAccount(id: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const [updated] = await db
    .update(personalAccounts)
    .set({ isActive: false })
    .where(and(eq(personalAccounts.id, id), eq(personalAccounts.organizationId, organizationId)))
    .returning({ id: personalAccounts.id });
  if (!updated) throw new Error("Conta pessoal não encontrada.");

  revalidatePath("/crm/pessoal");
  return { success: true };
}
