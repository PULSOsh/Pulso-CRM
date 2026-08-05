"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  financialRecurrenceRules,
  installments,
  payableInstallments,
  payables,
  receivables,
} from "../db/schema";
import { calculateNextDueDate } from "../services/recurrence";
import { financialRecurrenceSchema } from "./financial-recurrences.schemas";

export async function getFinancialRecurrences() {
  const { organizationId } = await requirePermission("financial_recurrences.read");

  return db.query.financialRecurrenceRules.findMany({
    where: eq(financialRecurrenceRules.organizationId, organizationId),
    orderBy: [asc(financialRecurrenceRules.nextRunDate)],
  });
}

export async function createFinancialRecurrence(input: unknown) {
  const { organizationId, userId } = await requirePermission("financial_recurrences.manage");
  const parsed = financialRecurrenceSchema.parse(input);

  const companyIds = [parsed.vendorCompanyId, parsed.clientCompanyId].filter(Boolean) as string[];
  if (companyIds.length > 0) {
    const found = await db.query.companies.findMany({
      where: (c, { and: andOp, eq: eqOp, inArray }) =>
        andOp(eqOp(c.organizationId, organizationId), inArray(c.id, companyIds)),
    });
    if (found.length !== companyIds.length) throw new Error("Empresa vinculada não encontrada.");
  }

  const [rule] = await db
    .insert(financialRecurrenceRules)
    .values({
      organizationId,
      targetType: parsed.targetType,
      frequency: parsed.frequency,
      startDate: new Date(parsed.startDate),
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      nextRunDate: new Date(parsed.startDate),
      description: parsed.description,
      amount: parsed.amount.toFixed(2),
      vendorCompanyId: parsed.vendorCompanyId || null,
      clientCompanyId: parsed.clientCompanyId || null,
      categoryId: parsed.categoryId || null,
      costCenterId: parsed.costCenterId || null,
      projectId: parsed.projectId || null,
      createdBy: userId,
    })
    .returning();

  revalidatePath("/crm/financeiro");
  return rule;
}

export async function deactivateFinancialRecurrence(id: string) {
  const { organizationId } = await requirePermission("financial_recurrences.manage");

  const [updated] = await db
    .update(financialRecurrenceRules)
    .set({ isActive: false })
    .where(
      and(
        eq(financialRecurrenceRules.id, id),
        eq(financialRecurrenceRules.organizationId, organizationId),
      ),
    )
    .returning({ id: financialRecurrenceRules.id });
  if (!updated) throw new Error("Regra de recorrência não encontrada.");

  revalidatePath("/crm/financeiro");
  return { success: true };
}

/** CRM-F3-07: sem motor de automação/job agendado nesta fase (Fase 5 do
 * plano mestre) - a equipe gera a próxima ocorrência sob demanda. Cada
 * chamada cria um recebível/pagável de parcela única com vencimento em
 * `nextRunDate` e avança a regra para a data seguinte. */
export async function generateNextRecurrenceOccurrence(ruleId: string) {
  const { organizationId, userId } = await requirePermission("financial_recurrences.manage");

  const rule = await db.query.financialRecurrenceRules.findFirst({
    where: and(
      eq(financialRecurrenceRules.id, ruleId),
      eq(financialRecurrenceRules.organizationId, organizationId),
    ),
  });
  if (!rule) throw new Error("Regra de recorrência não encontrada.");
  if (!rule.isActive) throw new Error("Regra de recorrência está desativada.");
  if (rule.endDate && rule.nextRunDate > rule.endDate) {
    throw new Error("Esta regra já passou da data de encerramento.");
  }

  const dueDate = rule.nextRunDate;
  const nextRunDate = calculateNextDueDate(dueDate, rule.frequency, 1);

  const created = await db.transaction(async (tx) => {
    let entity: { id: string };
    if (rule.targetType === "payable") {
      const [payable] = await tx
        .insert(payables)
        .values({
          organizationId,
          vendorCompanyId: rule.vendorCompanyId,
          categoryId: rule.categoryId,
          costCenterId: rule.costCenterId,
          projectId: rule.projectId,
          description: `${rule.description} (recorrência)`,
          totalAmount: rule.amount,
          status: "open",
          createdBy: userId,
        })
        .returning();
      await tx.insert(payableInstallments).values({
        payableId: payable.id,
        installmentNumber: 1,
        amount: rule.amount,
        dueDate,
        status: "pending",
      });
      entity = payable;
    } else {
      const [receivable] = await tx
        .insert(receivables)
        .values({
          organizationId,
          companyId: rule.clientCompanyId,
          description: `${rule.description} (recorrência)`,
          totalAmount: rule.amount,
          status: "open",
        })
        .returning();
      await tx.insert(installments).values({
        receivableId: receivable.id,
        installmentNumber: 1,
        amount: rule.amount,
        dueDate,
        status: "pending",
      });
      entity = receivable;
    }

    await tx
      .update(financialRecurrenceRules)
      .set({ nextRunDate, lastGeneratedAt: new Date() })
      .where(eq(financialRecurrenceRules.id, ruleId));

    return entity;
  });

  revalidatePath("/crm/financeiro");
  return created;
}
