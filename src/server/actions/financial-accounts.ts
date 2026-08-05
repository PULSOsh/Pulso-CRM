"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { financialAccounts } from "../db/schema";
import { financialAccountSchema } from "./financial-accounts.schemas";

export async function getFinancialAccounts() {
  const { organizationId } = await requirePermission("financial_accounts.read");

  return db.query.financialAccounts.findMany({
    where: eq(financialAccounts.organizationId, organizationId),
    orderBy: [desc(financialAccounts.isActive), asc(financialAccounts.name)],
  });
}

export async function createFinancialAccount(input: unknown) {
  const { organizationId } = await requirePermission("financial_accounts.manage");
  const parsed = financialAccountSchema.parse(input);

  const account = await db.transaction(async (tx) => {
    if (parsed.isDefault) {
      await tx
        .update(financialAccounts)
        .set({ isDefault: false })
        .where(eq(financialAccounts.organizationId, organizationId));
    }

    const [created] = await tx
      .insert(financialAccounts)
      .values({
        organizationId,
        name: parsed.name,
        accountType: parsed.accountType || null,
        institution: parsed.institution || null,
        pixKeyType: parsed.pixKeyType || null,
        pixKeyMasked: parsed.pixKeyMasked || null,
        isDefault: parsed.isDefault ?? false,
      })
      .returning();
    return created;
  });

  revalidatePath("/crm/financeiro");
  return account;
}

export async function updateFinancialAccount(id: string, input: unknown) {
  const { organizationId } = await requirePermission("financial_accounts.manage");
  const parsed = financialAccountSchema.parse(input);

  const existing = await db.query.financialAccounts.findFirst({
    where: and(eq(financialAccounts.id, id), eq(financialAccounts.organizationId, organizationId)),
  });
  if (!existing) throw new Error("Conta financeira não encontrada.");

  await db.transaction(async (tx) => {
    if (parsed.isDefault) {
      await tx
        .update(financialAccounts)
        .set({ isDefault: false })
        .where(eq(financialAccounts.organizationId, organizationId));
    }

    await tx
      .update(financialAccounts)
      .set({
        name: parsed.name,
        accountType: parsed.accountType || null,
        institution: parsed.institution || null,
        pixKeyType: parsed.pixKeyType || null,
        pixKeyMasked: parsed.pixKeyMasked || null,
        isDefault: parsed.isDefault ?? existing.isDefault,
      })
      .where(eq(financialAccounts.id, id));
  });

  revalidatePath("/crm/financeiro");
  return { success: true };
}

export async function deactivateFinancialAccount(id: string) {
  const { organizationId } = await requirePermission("financial_accounts.manage");

  const [updated] = await db
    .update(financialAccounts)
    .set({ isActive: false, isDefault: false })
    .where(and(eq(financialAccounts.id, id), eq(financialAccounts.organizationId, organizationId)))
    .returning({ id: financialAccounts.id });
  if (!updated) throw new Error("Conta financeira não encontrada.");

  revalidatePath("/crm/financeiro");
  return { success: true };
}
