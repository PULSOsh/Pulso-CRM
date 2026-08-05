"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { financialAccounts, financialTransactions } from "../db/schema";
import { writeAuditLog } from "../services/audit-log";
import { postFinancialTransaction } from "../services/ledger";
import { financialTransferSchema } from "./financial-transfers.schemas";

/** CRM-F3-06: transferência entre contas = duas linhas do razão (saída da
 * origem, entrada no destino) ligadas por `transferGroupId`, na mesma
 * transação - nunca uma perna sem a outra. */
export async function createFinancialTransfer(input: unknown) {
  const { organizationId, userId } = await requirePermission("financial_accounts.manage");
  const parsed = financialTransferSchema.parse(input);

  const accounts = await db.query.financialAccounts.findMany({
    where: and(
      eq(financialAccounts.organizationId, organizationId),
      inArray(financialAccounts.id, [parsed.fromAccountId, parsed.toAccountId]),
    ),
  });
  const fromAccount = accounts.find((a) => a.id === parsed.fromAccountId);
  const toAccount = accounts.find((a) => a.id === parsed.toAccountId);
  if (!fromAccount || !toAccount) throw new Error("Conta financeira não encontrada.");

  const transferGroupId = randomUUID();
  const description =
    parsed.description || `Transferência: ${fromAccount.name} → ${toAccount.name}`;

  await db.transaction(async (tx) => {
    await postFinancialTransaction(
      {
        organizationId,
        accountId: fromAccount.id,
        kind: "transfer_out",
        direction: "out",
        amount: parsed.amount,
        transferGroupId,
        description,
        notes: parsed.notes,
        createdBy: userId,
      },
      tx,
    );
    await postFinancialTransaction(
      {
        organizationId,
        accountId: toAccount.id,
        kind: "transfer_in",
        direction: "in",
        amount: parsed.amount,
        transferGroupId,
        description,
        notes: parsed.notes,
        createdBy: userId,
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "financial_transfer.created",
        entityType: "financial_transfer",
        entityId: transferGroupId,
        after: { fromAccountId: fromAccount.id, toAccountId: toAccount.id, amount: parsed.amount },
      },
      tx,
    );
  });

  revalidatePath("/crm/financeiro");
  return { success: true, transferGroupId };
}

export async function getFinancialTransactions(limit = 100) {
  const { organizationId } = await requirePermission("financial_accounts.read");

  return db.query.financialTransactions.findMany({
    where: eq(financialTransactions.organizationId, organizationId),
    orderBy: [desc(financialTransactions.occurredAt)],
    limit,
  });
}
