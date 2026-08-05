"use server";

import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { companies, payableInstallments, payables } from "../db/schema";
import { logActivity } from "../services/activity-log";
import { writeAuditLog } from "../services/audit-log";
import { deriveInstallmentStatus } from "../services/installment-status";
import { postFinancialTransaction } from "../services/ledger";
import { markPayableInstallmentPaidSchema, payableSchema } from "./payables.schemas";

/** CRM-F3-04: contas a pagar, mesmo padrão de receivables/installments
 * (cabeçalho + parcelas), incluindo a mesma validação de soma em centavos
 * (docs/ARCHITECTURE_AND_STANDARDS.md §7 - dinheiro nunca em float). */
export async function createPayable(input: unknown) {
  const { organizationId, userId } = await requirePermission("payables.create");
  const parsed = payableSchema.parse(input);

  if (parsed.vendorCompanyId) {
    const vendor = await db.query.companies.findFirst({
      where: and(
        eq(companies.id, parsed.vendorCompanyId),
        eq(companies.organizationId, organizationId),
      ),
    });
    if (!vendor) throw new Error("Fornecedor não encontrado.");
  }

  const totalCents = parsed.installmentsPlan.reduce(
    (acc, item) => acc + Math.round(item.amount * 100),
    0,
  );
  if (totalCents <= 0) throw new Error("O valor total das parcelas deve ser maior que zero.");

  const payable = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(payables)
      .values({
        organizationId,
        vendorCompanyId: parsed.vendorCompanyId || null,
        categoryId: parsed.categoryId || null,
        costCenterId: parsed.costCenterId || null,
        projectId: parsed.projectId || null,
        description: parsed.description,
        totalAmount: (totalCents / 100).toFixed(2),
        status: "open",
        createdBy: userId,
      })
      .returning();

    await tx.insert(payableInstallments).values(
      parsed.installmentsPlan.map((item, index) => ({
        payableId: created.id,
        installmentNumber: index + 1,
        amount: item.amount.toFixed(2),
        dueDate: new Date(item.dueDate),
        status: "pending" as const,
      })),
    );

    return created;
  });

  revalidatePath("/crm/financeiro");
  return payable;
}

export async function getPayables() {
  const { organizationId } = await requirePermission("payables.read");

  const allPayables = await db.query.payables.findMany({
    where: eq(payables.organizationId, organizationId),
    orderBy: [desc(payables.createdAt)],
  });

  const vendorIds = allPayables.map((p) => p.vendorCompanyId).filter(Boolean) as string[];
  const vendors =
    vendorIds.length > 0
      ? await db.query.companies.findMany({ where: (c, { inArray }) => inArray(c.id, vendorIds) })
      : [];

  const results = await Promise.all(
    allPayables.map(async (p) => {
      const items = await db.query.payableInstallments.findMany({
        where: eq(payableInstallments.payableId, p.id),
        orderBy: [asc(payableInstallments.installmentNumber)],
      });
      return {
        ...p,
        vendor: vendors.find((v) => v.id === p.vendorCompanyId),
        installments: items,
      };
    }),
  );

  return results;
}

/** Sem job agendado (mesmo débito de refreshOverdueInstallments em
 * finance.ts) - verificação sob demanda. */
export async function refreshOverduePayableInstallments() {
  const { organizationId } = await requirePermission("payables.read");

  const orgPayableIds = db
    .select({ id: payables.id })
    .from(payables)
    .where(eq(payables.organizationId, organizationId));

  await db
    .update(payableInstallments)
    .set({ status: "overdue", updatedAt: new Date() })
    .where(
      and(
        eq(payableInstallments.status, "pending"),
        lt(payableInstallments.dueDate, new Date()),
        inArray(payableInstallments.payableId, orgPayableIds),
      ),
    );
}

/** CRM-F3-04/F3-05/F3-06: baixa acumulativa (aceita paidAmount parcial em
 * mais de uma chamada) e escreve uma linha no razão (financial_transactions)
 * a cada baixa - nunca sobrescreve a anterior. */
export async function markPayableInstallmentPaid(installmentId: string, input: unknown) {
  const { organizationId, userId } = await requirePermission("payables.mark_paid");
  const parsed = markPayableInstallmentPaidSchema.parse(input);

  const installment = await db.query.payableInstallments.findFirst({
    where: eq(payableInstallments.id, installmentId),
  });
  if (!installment) throw new Error("Parcela não encontrada.");

  const payable = await db.query.payables.findFirst({
    where: and(eq(payables.id, installment.payableId), eq(payables.organizationId, organizationId)),
  });
  if (!payable) throw new Error("Parcela não encontrada.");
  if (installment.status === "paid") throw new Error("Parcela já baixada.");
  if (installment.status === "cancelled")
    throw new Error("Parcela cancelada não pode ser baixada.");

  const alreadyPaid = Number(installment.paidAmount ?? 0);
  const totalPaid = alreadyPaid + parsed.paidAmount;
  if (totalPaid > Number(installment.amount) + 0.005) {
    throw new Error("O valor pago não pode superar o valor da parcela.");
  }
  const newStatus = deriveInstallmentStatus(
    Number(installment.amount),
    totalPaid,
    installment.dueDate,
  );

  await db.transaction(async (tx) => {
    await tx
      .update(payableInstallments)
      .set({
        status: newStatus,
        paidAt: new Date(),
        paidAmount: totalPaid.toFixed(2),
        paymentMethod: parsed.paymentMethod || installment.paymentMethod,
        accountId: parsed.accountId || installment.accountId,
        notes: parsed.notes || installment.notes,
        updatedAt: new Date(),
      })
      .where(eq(payableInstallments.id, installmentId));

    const remaining = await tx.query.payableInstallments.findMany({
      where: eq(payableInstallments.payableId, payable.id),
    });
    const allPaid = remaining.every((i) => i.id === installmentId || i.status === "paid");
    if (allPaid && newStatus === "paid") {
      await tx
        .update(payables)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(payables.id, payable.id));
    }

    await postFinancialTransaction(
      {
        organizationId,
        accountId: parsed.accountId || null,
        kind: "payable_payment",
        direction: "out",
        amount: parsed.paidAmount,
        categoryId: payable.categoryId,
        costCenterId: payable.costCenterId,
        sourceType: "payable_installment",
        sourceId: installmentId,
        description: `Pagamento: ${payable.description} (parcela ${installment.installmentNumber})`,
        createdBy: userId,
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "payable_installment.paid",
        entityType: "payable_installment",
        entityId: installmentId,
        before: { status: installment.status, paidAmount: installment.paidAmount },
        after: { status: newStatus, paidAmount: totalPaid },
      },
      tx,
    );

    if (payable.projectId) {
      await logActivity(
        {
          organizationId,
          actorUserId: userId,
          type: "payment",
          title: `Pagamento registrado: ${payable.description}`,
        },
        tx,
      );
    }
  });

  revalidatePath("/crm/financeiro");
  return { success: true };
}

/** Estorno como evento inverso, com suporte a reversão parcial (`amount`
 * opcional - default reverte todo o valor pago até agora). */
export async function reversePayableInstallmentPayment(
  installmentId: string,
  reason: string,
  amount?: number,
) {
  const { organizationId, userId } = await requirePermission("payables.reverse");

  const installment = await db.query.payableInstallments.findFirst({
    where: eq(payableInstallments.id, installmentId),
  });
  if (!installment) throw new Error("Parcela não encontrada.");
  const paidSoFar = Number(installment.paidAmount ?? 0);
  if (paidSoFar <= 0) throw new Error("Esta parcela não tem pagamento para estornar.");

  const payable = await db.query.payables.findFirst({
    where: and(eq(payables.id, installment.payableId), eq(payables.organizationId, organizationId)),
  });
  if (!payable) throw new Error("Parcela não encontrada.");

  const reversalAmount = amount ?? paidSoFar;
  if (reversalAmount > paidSoFar + 0.005) {
    throw new Error("O valor do estorno não pode superar o valor pago.");
  }
  const newPaidAmount = Math.max(0, paidSoFar - reversalAmount);
  const newStatus = deriveInstallmentStatus(
    Number(installment.amount),
    newPaidAmount,
    installment.dueDate,
  );

  await db.transaction(async (tx) => {
    await tx
      .update(payableInstallments)
      .set({
        status: newStatus,
        paidAmount: newPaidAmount > 0 ? newPaidAmount.toFixed(2) : null,
        paidAt: newPaidAmount > 0 ? installment.paidAt : null,
        notes: `${installment.notes ? `${installment.notes}\n` : ""}Estornado: ${reason}`,
        updatedAt: new Date(),
      })
      .where(eq(payableInstallments.id, installmentId));

    await tx
      .update(payables)
      .set({ status: "open", updatedAt: new Date() })
      .where(eq(payables.id, payable.id));

    await postFinancialTransaction(
      {
        organizationId,
        accountId: installment.accountId,
        kind: "payable_payment",
        direction: "in",
        amount: reversalAmount,
        categoryId: payable.categoryId,
        costCenterId: payable.costCenterId,
        sourceType: "payable_installment",
        sourceId: installmentId,
        description: `Estorno: ${payable.description} (parcela ${installment.installmentNumber})`,
        notes: reason,
        createdBy: userId,
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "payable_installment.reversed",
        entityType: "payable_installment",
        entityId: installmentId,
        before: { status: installment.status, paidAmount: paidSoFar },
        after: { status: newStatus, paidAmount: newPaidAmount, reason },
      },
      tx,
    );
  });

  revalidatePath("/crm/financeiro");
  return { success: true };
}
