"use server";

import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import {
  personalCreditCardInvoices,
  personalCreditCards,
  personalTransactions,
} from "../db/schema";
import { requirePersonalAccess } from "../services/personal-workspace";
import {
  payPersonalInvoiceSchema,
  personalCreditCardSchema,
} from "./personal-credit-cards.schemas";

export async function getPersonalCreditCards() {
  const { organizationId } = await requirePersonalAccess("read");

  return db.query.personalCreditCards.findMany({
    where: and(
      eq(personalCreditCards.organizationId, organizationId),
      eq(personalCreditCards.isActive, true),
    ),
    orderBy: [asc(personalCreditCards.name)],
  });
}

export async function createPersonalCreditCard(input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = personalCreditCardSchema.parse(input);

  const [card] = await db
    .insert(personalCreditCards)
    .values({
      organizationId,
      name: parsed.name,
      closingDay: parsed.closingDay,
      dueDay: parsed.dueDay,
      limitAmount: parsed.limitAmount?.toFixed(2),
    })
    .returning();

  revalidatePath("/crm/pessoal");
  return card;
}

export async function deactivatePersonalCreditCard(id: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const [updated] = await db
    .update(personalCreditCards)
    .set({ isActive: false })
    .where(
      and(eq(personalCreditCards.id, id), eq(personalCreditCards.organizationId, organizationId)),
    )
    .returning({ id: personalCreditCards.id });
  if (!updated) throw new Error("Cartão não encontrado.");

  revalidatePath("/crm/pessoal");
  return { success: true };
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** CRM-F4-04: o valor da fatura é sempre derivado somando os lançamentos do
 * mês vinculados ao cartão (nunca duplicado numa coluna própria) - só o
 * status de pagamento é persistido, em personal_credit_card_invoices. */
export async function getCreditCardInvoices(cardId: string, monthsBack = 6) {
  const { organizationId } = await requirePersonalAccess("read");

  const card = await db.query.personalCreditCards.findFirst({
    where: and(
      eq(personalCreditCards.id, cardId),
      eq(personalCreditCards.organizationId, organizationId),
    ),
  });
  if (!card) throw new Error("Cartão não encontrado.");

  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return d;
  });

  const results = await Promise.all(
    months.map(async (month) => {
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      const totalRow = await db
        .select({ total: sql<string>`coalesce(sum(${personalTransactions.amount}), 0)` })
        .from(personalTransactions)
        .where(
          and(
            eq(personalTransactions.organizationId, organizationId),
            eq(personalTransactions.creditCardId, cardId),
            gte(personalTransactions.occurredAt, month),
            lt(personalTransactions.occurredAt, nextMonth),
          ),
        );

      const invoice = await db.query.personalCreditCardInvoices.findFirst({
        where: and(
          eq(personalCreditCardInvoices.cardId, cardId),
          eq(personalCreditCardInvoices.referenceMonth, month),
        ),
      });

      return {
        referenceMonth: month,
        dueDate: new Date(month.getFullYear(), month.getMonth(), card.dueDay),
        total: Number(totalRow[0]?.total ?? 0),
        status: invoice?.status ?? "open",
        paidAt: invoice?.paidAt ?? null,
        paidAmount: invoice?.paidAmount ?? null,
      };
    }),
  );

  return results;
}

export async function payPersonalInvoice(cardId: string, referenceMonth: string, input: unknown) {
  const { organizationId } = await requirePersonalAccess("manage");
  const parsed = payPersonalInvoiceSchema.parse(input);

  const card = await db.query.personalCreditCards.findFirst({
    where: and(
      eq(personalCreditCards.id, cardId),
      eq(personalCreditCards.organizationId, organizationId),
    ),
  });
  if (!card) throw new Error("Cartão não encontrado.");

  const month = monthStart(new Date(referenceMonth));
  const dueDate = new Date(month.getFullYear(), month.getMonth(), card.dueDay);

  await db
    .insert(personalCreditCardInvoices)
    .values({
      cardId,
      referenceMonth: month,
      dueDate,
      status: "paid",
      paidAt: new Date(),
      paidAmount: parsed.paidAmount.toFixed(2),
    })
    .onConflictDoUpdate({
      target: [personalCreditCardInvoices.cardId, personalCreditCardInvoices.referenceMonth],
      set: { status: "paid", paidAt: new Date(), paidAmount: parsed.paidAmount.toFixed(2) },
    });

  revalidatePath("/crm/pessoal");
  return { success: true };
}
