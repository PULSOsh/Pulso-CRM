"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { personalTransactions } from "../db/schema";
import { requirePersonalAccess } from "../services/personal-workspace";
import { calculateNextDueDate } from "../services/recurrence";
import { personalTransactionSchema, personalTransferSchema } from "./personal-transactions.schemas";

export async function getPersonalTransactions(range?: { from: string; to: string }) {
  const { organizationId } = await requirePersonalAccess("read");

  return db.query.personalTransactions.findMany({
    where: and(
      eq(personalTransactions.organizationId, organizationId),
      ...(range
        ? [
            gte(personalTransactions.occurredAt, new Date(range.from)),
            lte(personalTransactions.occurredAt, new Date(range.to)),
          ]
        : []),
    ),
    orderBy: [desc(personalTransactions.occurredAt)],
  });
}

/** CRM-F4-05: `installments > 1` divide o valor em N linhas mensais
 * (parcelamento), compartilhando `installmentGroupId` - sem tabela própria
 * de parcelamento, é só o mesmo lançamento repetido com data avançada mês a
 * mês (calculateNextDueDate, reaproveitado de task-recurrences). */
export async function createPersonalTransaction(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalTransactionSchema.parse(input);
  const installmentTotal = parsed.installments ?? 1;
  const groupId = installmentTotal > 1 ? randomUUID() : null;

  const values = Array.from({ length: installmentTotal }, (_, index) => {
    const occurredAt =
      index === 0
        ? new Date(parsed.occurredAt)
        : calculateNextDueDate(new Date(parsed.occurredAt), "monthly", index);
    return {
      organizationId,
      accountId: parsed.accountId || null,
      categoryId: parsed.categoryId || null,
      creditCardId: parsed.creditCardId || null,
      kind: parsed.kind,
      amount: (parsed.amount / installmentTotal).toFixed(2),
      occurredAt,
      description: parsed.description,
      notes: parsed.notes || null,
      installmentGroupId: groupId,
      installmentNumber: installmentTotal > 1 ? index + 1 : null,
      installmentTotal: installmentTotal > 1 ? installmentTotal : null,
    };
  });

  const created = await db.insert(personalTransactions).values(values).returning();

  revalidatePath("/crm/pessoal");
  return created;
}

export async function updatePersonalTransaction(id: string, input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalTransactionSchema.parse(input);

  const [updated] = await db
    .update(personalTransactions)
    .set({
      kind: parsed.kind,
      accountId: parsed.accountId || null,
      categoryId: parsed.categoryId || null,
      creditCardId: parsed.creditCardId || null,
      amount: parsed.amount.toFixed(2),
      occurredAt: new Date(parsed.occurredAt),
      description: parsed.description,
      notes: parsed.notes || null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(personalTransactions.id, id), eq(personalTransactions.organizationId, organizationId)),
    )
    .returning({ id: personalTransactions.id });
  if (!updated) throw new Error("Lançamento não encontrado.");

  revalidatePath("/crm/pessoal");
  return { success: true };
}

export async function deletePersonalTransaction(id: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const deleted = await db
    .delete(personalTransactions)
    .where(
      and(eq(personalTransactions.id, id), eq(personalTransactions.organizationId, organizationId)),
    )
    .returning({ id: personalTransactions.id });
  if (deleted.length === 0) throw new Error("Lançamento não encontrado.");

  revalidatePath("/crm/pessoal");
  return { success: true };
}

export async function createPersonalTransfer(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalTransferSchema.parse(input);

  const accounts = await db.query.personalAccounts.findMany({
    where: (a, { and: andOp, eq: eqOp, inArray }) =>
      andOp(
        eqOp(a.organizationId, organizationId),
        inArray(a.id, [parsed.fromAccountId, parsed.toAccountId]),
      ),
  });
  const fromAccount = accounts.find((a) => a.id === parsed.fromAccountId);
  const toAccount = accounts.find((a) => a.id === parsed.toAccountId);
  if (!fromAccount || !toAccount) throw new Error("Conta pessoal não encontrada.");

  const transferGroupId = randomUUID();
  const description =
    parsed.description || `Transferência: ${fromAccount.name} → ${toAccount.name}`;
  const occurredAt = new Date(parsed.occurredAt);

  await db.insert(personalTransactions).values([
    {
      organizationId,
      accountId: fromAccount.id,
      kind: "transfer_out",
      amount: parsed.amount.toFixed(2),
      occurredAt,
      description,
      transferGroupId,
    },
    {
      organizationId,
      accountId: toAccount.id,
      kind: "transfer_in",
      amount: parsed.amount.toFixed(2),
      occurredAt,
      description,
      transferGroupId,
    },
  ]);

  revalidatePath("/crm/pessoal");
  return { success: true };
}
