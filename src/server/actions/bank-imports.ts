"use server";

import { and, asc, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  bankImportLines,
  bankImports,
  financialAccounts,
  financialTransactions,
} from "../db/schema";
import { writeAuditLog } from "../services/audit-log";
import { parseCsvStatement, parseOfxStatement } from "../services/bank-import";
import { bankImportSchema } from "./bank-imports.schemas";

/** CRM-F3-08: importa um extrato (CSV ou OFX) como uma leva de linhas
 * pendentes de conciliação - não gera nenhuma transação no razão por si só,
 * só cria material para casar com o que já foi lançado (F3-09). */
export async function createBankImport(input: unknown) {
  const { organizationId, userId } = await requirePermission("bank_imports.manage");
  const parsed = bankImportSchema.parse(input);

  if (parsed.accountId) {
    const account = await db.query.financialAccounts.findFirst({
      where: and(
        eq(financialAccounts.id, parsed.accountId),
        eq(financialAccounts.organizationId, organizationId),
      ),
    });
    if (!account) throw new Error("Conta financeira não encontrada.");
  }

  const statementLines =
    parsed.format === "ofx" ? parseOfxStatement(parsed.content) : parseCsvStatement(parsed.content);
  if (statementLines.length === 0) {
    throw new Error("Nenhum lançamento reconhecido no arquivo.");
  }

  const bankImport = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(bankImports)
      .values({
        organizationId,
        accountId: parsed.accountId || null,
        fileName: parsed.fileName,
        format: parsed.format,
        importedBy: userId,
        totalLines: statementLines.length,
      })
      .returning();

    await tx.insert(bankImportLines).values(
      statementLines.map((line) => ({
        bankImportId: created.id,
        lineDate: line.date,
        description: line.description,
        amount: line.amount.toFixed(2),
        externalId: line.externalId,
        status: "unmatched" as const,
      })),
    );

    return created;
  });

  revalidatePath("/crm/financeiro");
  return bankImport;
}

export async function getBankImports() {
  const { organizationId } = await requirePermission("bank_imports.manage");

  return db.query.bankImports.findMany({
    where: eq(bankImports.organizationId, organizationId),
    orderBy: [desc(bankImports.importedAt)],
  });
}

export async function getBankImportLines(bankImportId: string) {
  const { organizationId } = await requirePermission("bank_imports.manage");

  const bankImport = await db.query.bankImports.findFirst({
    where: and(eq(bankImports.id, bankImportId), eq(bankImports.organizationId, organizationId)),
  });
  if (!bankImport) throw new Error("Importação não encontrada.");

  return db.query.bankImportLines.findMany({
    where: eq(bankImportLines.bankImportId, bankImportId),
    orderBy: [asc(bankImportLines.lineDate)],
  });
}

/** CRM-F3-09: candidatas por proximidade de valor (exato, em módulo) e data
 * (+-5 dias) entre transações do razão ainda não conciliadas - a decisão
 * final de casar é sempre manual (o usuário escolhe entre as sugestões). */
export async function getReconciliationCandidates(lineId: string) {
  const { organizationId } = await requirePermission("bank_imports.manage");

  const line = await db.query.bankImportLines.findFirst({
    where: eq(bankImportLines.id, lineId),
  });
  if (!line) throw new Error("Linha do extrato não encontrada.");

  const amount = Math.abs(Number(line.amount)).toFixed(2);
  const from = new Date(line.lineDate);
  from.setDate(from.getDate() - 5);
  const to = new Date(line.lineDate);
  to.setDate(to.getDate() + 5);

  return db.query.financialTransactions.findMany({
    where: and(
      eq(financialTransactions.organizationId, organizationId),
      eq(financialTransactions.amount, amount),
      isNull(financialTransactions.reconciledAt),
      gte(financialTransactions.occurredAt, from),
      lte(financialTransactions.occurredAt, to),
    ),
    orderBy: [asc(financialTransactions.occurredAt)],
  });
}

export async function matchBankImportLine(lineId: string, transactionId: string) {
  const { organizationId, userId } = await requirePermission("bank_imports.manage");

  const line = await db.query.bankImportLines.findFirst({
    where: eq(bankImportLines.id, lineId),
  });
  if (!line) throw new Error("Linha do extrato não encontrada.");

  const transaction = await db.query.financialTransactions.findFirst({
    where: and(
      eq(financialTransactions.id, transactionId),
      eq(financialTransactions.organizationId, organizationId),
    ),
  });
  if (!transaction) throw new Error("Transação não encontrada.");

  await db.transaction(async (tx) => {
    await tx
      .update(bankImportLines)
      .set({
        status: "matched",
        matchedTransactionId: transactionId,
        matchedAt: new Date(),
        matchedBy: userId,
      })
      .where(eq(bankImportLines.id, lineId));

    await tx
      .update(financialTransactions)
      .set({ reconciledAt: new Date() })
      .where(eq(financialTransactions.id, transactionId));

    if (line.status !== "matched") {
      await tx
        .update(bankImports)
        .set({ matchedLines: sql`${bankImports.matchedLines} + 1` })
        .where(eq(bankImports.id, line.bankImportId));
    }

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "bank_import_line.matched",
        entityType: "bank_import_line",
        entityId: lineId,
        after: { transactionId },
      },
      tx,
    );
  });

  revalidatePath("/crm/financeiro");
  return { success: true };
}

export async function ignoreBankImportLine(lineId: string) {
  const { organizationId } = await requirePermission("bank_imports.manage");

  const line = await db.query.bankImportLines.findFirst({
    where: eq(bankImportLines.id, lineId),
  });
  if (!line) throw new Error("Linha do extrato não encontrada.");
  const bankImport = await db.query.bankImports.findFirst({
    where: and(
      eq(bankImports.id, line.bankImportId),
      eq(bankImports.organizationId, organizationId),
    ),
  });
  if (!bankImport) throw new Error("Linha do extrato não encontrada.");

  await db.update(bankImportLines).set({ status: "ignored" }).where(eq(bankImportLines.id, lineId));

  revalidatePath("/crm/financeiro");
  return { success: true };
}

export async function unmatchBankImportLine(lineId: string) {
  const { organizationId } = await requirePermission("bank_imports.manage");

  const line = await db.query.bankImportLines.findFirst({
    where: eq(bankImportLines.id, lineId),
  });
  if (!line) throw new Error("Linha do extrato não encontrada.");
  const bankImport = await db.query.bankImports.findFirst({
    where: and(
      eq(bankImports.id, line.bankImportId),
      eq(bankImports.organizationId, organizationId),
    ),
  });
  if (!bankImport) throw new Error("Linha do extrato não encontrada.");

  await db.transaction(async (tx) => {
    if (line.matchedTransactionId) {
      await tx
        .update(financialTransactions)
        .set({ reconciledAt: null })
        .where(eq(financialTransactions.id, line.matchedTransactionId));
    }
    if (line.status === "matched") {
      await tx
        .update(bankImports)
        .set({ matchedLines: sql`greatest(${bankImports.matchedLines} - 1, 0)` })
        .where(eq(bankImports.id, line.bankImportId));
    }
    await tx
      .update(bankImportLines)
      .set({ status: "unmatched", matchedTransactionId: null, matchedAt: null, matchedBy: null })
      .where(eq(bankImportLines.id, lineId));
  });

  revalidatePath("/crm/financeiro");
  return { success: true };
}
