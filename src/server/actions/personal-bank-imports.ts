"use server";

import { and, asc, desc, eq, gte, lte, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import {
  personalAccounts,
  personalBankImportLines,
  personalBankImports,
  personalTransactions,
} from "../db/schema";
import { parseCsvStatement, parseOfxStatement } from "../services/bank-import";
import { requirePersonalAccess } from "../services/personal-workspace";
import { personalBankImportSchema } from "./personal-bank-imports.schemas";

/** CRM-F4-08: mesmo parser CSV/OFX genérico já usado no razão empresarial
 * (Fase 3, services/bank-import.ts) - só a tabela de destino muda. */
export async function createPersonalBankImport(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalBankImportSchema.parse(input);

  if (parsed.accountId) {
    const account = await db.query.personalAccounts.findFirst({
      where: and(
        eq(personalAccounts.id, parsed.accountId),
        eq(personalAccounts.organizationId, organizationId),
      ),
    });
    if (!account) throw new Error("Conta pessoal não encontrada.");
  }

  const statementLines =
    parsed.format === "ofx" ? parseOfxStatement(parsed.content) : parseCsvStatement(parsed.content);
  if (statementLines.length === 0) throw new Error("Nenhum lançamento reconhecido no arquivo.");

  const bankImport = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(personalBankImports)
      .values({
        organizationId,
        accountId: parsed.accountId || null,
        fileName: parsed.fileName,
        format: parsed.format,
        totalLines: statementLines.length,
      })
      .returning();

    await tx.insert(personalBankImportLines).values(
      statementLines.map((line) => ({
        importId: created.id,
        lineDate: line.date,
        description: line.description,
        amount: line.amount.toFixed(2),
        externalId: line.externalId,
        status: "unmatched" as const,
      })),
    );

    return created;
  });

  revalidatePath("/crm/pessoal");
  return bankImport;
}

export async function getPersonalBankImports() {
  const { organizationId } = await requirePersonalAccess("read");
  return db.query.personalBankImports.findMany({
    where: eq(personalBankImports.organizationId, organizationId),
    orderBy: [desc(personalBankImports.importedAt)],
  });
}

export async function getPersonalBankImportLines(importId: string) {
  const { organizationId } = await requirePersonalAccess("read");

  const bankImport = await db.query.personalBankImports.findFirst({
    where: and(
      eq(personalBankImports.id, importId),
      eq(personalBankImports.organizationId, organizationId),
    ),
  });
  if (!bankImport) throw new Error("Importação não encontrada.");

  return db.query.personalBankImportLines.findMany({
    where: eq(personalBankImportLines.importId, importId),
    orderBy: [asc(personalBankImportLines.lineDate)],
  });
}

export async function getPersonalReconciliationCandidates(lineId: string) {
  const { organizationId } = await requirePersonalAccess("read");

  const line = await db.query.personalBankImportLines.findFirst({
    where: eq(personalBankImportLines.id, lineId),
  });
  if (!line) throw new Error("Linha do extrato não encontrada.");

  const amount = Math.abs(Number(line.amount)).toFixed(2);
  const from = new Date(line.lineDate);
  from.setDate(from.getDate() - 5);
  const to = new Date(line.lineDate);
  to.setDate(to.getDate() + 5);

  const alreadyMatched = db
    .select({ id: personalBankImportLines.matchedTransactionId })
    .from(personalBankImportLines)
    .where(sql`${personalBankImportLines.matchedTransactionId} is not null`);

  return db.query.personalTransactions.findMany({
    where: and(
      eq(personalTransactions.organizationId, organizationId),
      eq(personalTransactions.amount, amount),
      gte(personalTransactions.occurredAt, from),
      lte(personalTransactions.occurredAt, to),
      notInArray(personalTransactions.id, alreadyMatched),
    ),
    orderBy: [asc(personalTransactions.occurredAt)],
  });
}

export async function matchPersonalBankImportLine(lineId: string, transactionId: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const line = await db.query.personalBankImportLines.findFirst({
    where: eq(personalBankImportLines.id, lineId),
  });
  if (!line) throw new Error("Linha do extrato não encontrada.");

  const transaction = await db.query.personalTransactions.findFirst({
    where: and(
      eq(personalTransactions.id, transactionId),
      eq(personalTransactions.organizationId, organizationId),
    ),
  });
  if (!transaction) throw new Error("Lançamento não encontrado.");

  await db.transaction(async (tx) => {
    await tx
      .update(personalBankImportLines)
      .set({ status: "matched", matchedTransactionId: transactionId, matchedAt: new Date() })
      .where(eq(personalBankImportLines.id, lineId));

    if (line.status !== "matched") {
      await tx
        .update(personalBankImports)
        .set({ matchedLines: sql`${personalBankImports.matchedLines} + 1` })
        .where(eq(personalBankImports.id, line.importId));
    }
  });

  revalidatePath("/crm/pessoal");
  return { success: true };
}

export async function ignorePersonalBankImportLine(lineId: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const line = await db.query.personalBankImportLines.findFirst({
    where: eq(personalBankImportLines.id, lineId),
  });
  if (!line) throw new Error("Linha do extrato não encontrada.");
  const bankImport = await db.query.personalBankImports.findFirst({
    where: and(
      eq(personalBankImports.id, line.importId),
      eq(personalBankImports.organizationId, organizationId),
    ),
  });
  if (!bankImport) throw new Error("Linha do extrato não encontrada.");

  await db
    .update(personalBankImportLines)
    .set({ status: "ignored" })
    .where(eq(personalBankImportLines.id, lineId));

  revalidatePath("/crm/pessoal");
  return { success: true };
}

export async function unmatchPersonalBankImportLine(lineId: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const line = await db.query.personalBankImportLines.findFirst({
    where: eq(personalBankImportLines.id, lineId),
  });
  if (!line) throw new Error("Linha do extrato não encontrada.");
  const bankImport = await db.query.personalBankImports.findFirst({
    where: and(
      eq(personalBankImports.id, line.importId),
      eq(personalBankImports.organizationId, organizationId),
    ),
  });
  if (!bankImport) throw new Error("Linha do extrato não encontrada.");

  await db.transaction(async (tx) => {
    if (line.status === "matched") {
      await tx
        .update(personalBankImports)
        .set({ matchedLines: sql`greatest(${personalBankImports.matchedLines} - 1, 0)` })
        .where(eq(personalBankImports.id, line.importId));
    }
    await tx
      .update(personalBankImportLines)
      .set({ status: "unmatched", matchedTransactionId: null, matchedAt: null })
      .where(eq(personalBankImportLines.id, lineId));
  });

  revalidatePath("/crm/pessoal");
  return { success: true };
}
