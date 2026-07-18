"use server";

import { and, eq, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  expenseCategories,
  expenses,
  financialSettings,
  installments,
  receivables,
} from "../db/schema";
import * as profitability from "../services/profitability";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function getFinancialSettingsRow(organizationId: string) {
  const row = await db.query.financialSettings.findFirst({
    where: eq(financialSettings.organizationId, organizationId),
  });
  return {
    monthlyPersonalNeed: Number(row?.monthlyPersonalNeed ?? 0),
    businessCashBalance: Number(row?.businessCashBalance ?? 0),
    personalCashBalance: Number(row?.personalCashBalance ?? 0),
    monthlyCapacityHours: Number(row?.monthlyCapacityHours ?? 0),
  };
}

export async function getFinancialSettings() {
  const { organizationId } = await requirePermission("profitability.read_business");
  return getFinancialSettingsRow(organizationId);
}

export async function updateFinancialSettings(data: {
  monthlyPersonalNeed?: number;
  businessCashBalance?: number;
  personalCashBalance?: number;
  monthlyCapacityHours?: number;
}) {
  const { organizationId } = await requirePermission("profitability.manage_business");

  await db
    .insert(financialSettings)
    .values({
      organizationId,
      monthlyPersonalNeed: data.monthlyPersonalNeed?.toFixed(2),
      businessCashBalance: data.businessCashBalance?.toFixed(2),
      personalCashBalance: data.personalCashBalance?.toFixed(2),
      monthlyCapacityHours: data.monthlyCapacityHours?.toFixed(1),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: financialSettings.organizationId,
      set: {
        monthlyPersonalNeed: data.monthlyPersonalNeed?.toFixed(2),
        businessCashBalance: data.businessCashBalance?.toFixed(2),
        personalCashBalance: data.personalCashBalance?.toFixed(2),
        monthlyCapacityHours: data.monthlyCapacityHours?.toFixed(1),
        updatedAt: new Date(),
      },
    });

  revalidatePath("/crm/lucratividade");
  return { success: true };
}

export async function getExpenseCategories() {
  const { organizationId } = await requirePermission("profitability.read_business");
  return db.query.expenseCategories.findMany({
    where: eq(expenseCategories.organizationId, organizationId),
  });
}

export async function createExpense(data: {
  categoryId?: string;
  projectId?: string;
  productId?: string;
  scope: "personal" | "business" | "project";
  type:
    | "fixed"
    | "variable"
    | "investment"
    | "pro_labore"
    | "withdrawal"
    | "distribution"
    | "reimbursement"
    | "contribution"
    | "personal_paid_by_company";
  description: string;
  amount: number;
  competenceDate: string;
}) {
  const permission =
    data.scope === "personal" ? "profitability.manage_personal" : "profitability.manage_business";
  const { organizationId, userId } = await requirePermission(permission);

  const [expense] = await db
    .insert(expenses)
    .values({
      organizationId,
      categoryId: data.categoryId,
      projectId: data.projectId,
      productId: data.productId,
      scope: data.scope,
      type: data.type,
      description: data.description,
      amount: data.amount.toFixed(2),
      competenceDate: new Date(data.competenceDate),
      status: "planned",
      createdBy: userId,
    })
    .returning();

  revalidatePath("/crm/lucratividade");
  return expense;
}

/** docs/MODULE_SPECIFICATIONS.md §13 - dados empresariais, sem despesas
 * pessoais. `profitability.read_business` é a permissão mais ampla
 * (finance/admin/owner têm; comercial/projetos não). */
export async function getBusinessProfitability(days: number) {
  const { organizationId } = await requirePermission("profitability.read_business");
  const since = daysAgo(days);

  const businessExpenses = await db.query.expenses.findMany({
    where: and(
      eq(expenses.organizationId, organizationId),
      eq(expenses.scope, "business"),
      gte(expenses.competenceDate, since),
    ),
  });

  const fixed = businessExpenses
    .filter((e) => e.type === "fixed")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const variable = businessExpenses
    .filter((e) => e.type === "variable")
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const orgReceivables = await db.query.receivables.findMany({
    where: eq(receivables.organizationId, organizationId),
  });
  const contractedRevenue = orgReceivables.reduce((acc, r) => acc + Number(r.totalAmount), 0);

  const receivableIds = orgReceivables.map((r) => r.id);
  const allInstallments =
    receivableIds.length > 0
      ? await db.query.installments.findMany({
          where: inArray(installments.receivableId, receivableIds),
        })
      : [];
  const receivedRevenue = allInstallments
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + Number(i.paidAmount ?? i.amount), 0);

  const settings = await getFinancialSettingsRow(organizationId);

  const businessFixedCost = profitability.fixedCost(fixed);
  const margin = profitability.contributionMargin(receivedRevenue, variable);
  const marginRatio = profitability.contributionMarginRatio(receivedRevenue, variable);
  const result = profitability.operationalResult(margin, businessFixedCost);
  const breakEven = profitability.breakEvenRevenue(businessFixedCost, marginRatio);
  const runway = profitability.runwayMonths(settings.businessCashBalance, businessFixedCost);

  return {
    fixedCost: businessFixedCost,
    variableCosts: variable,
    contractedRevenue,
    receivedRevenue,
    contributionMargin: margin,
    contributionMarginRatio: marginRatio,
    operationalResult: result,
    breakEvenRevenue: breakEven,
    businessRunwayMonths: runway,
  };
}

/** Acesso exclusivo do fundador (docs/MODULE_SPECIFICATIONS.md §13) - a
 * permissão profitability.read_personal só existe no papel owner. */
export async function getPersonalProfitability(days: number) {
  const { organizationId } = await requirePermission("profitability.read_personal");
  const since = daysAgo(days);

  const business = await getBusinessProfitability(days);
  const settings = await getFinancialSettingsRow(organizationId);

  const personalExpenses = await db.query.expenses.findMany({
    where: and(
      eq(expenses.organizationId, organizationId),
      eq(expenses.scope, "personal"),
      gte(expenses.competenceDate, since),
    ),
  });
  const personalWithdrawals = personalExpenses
    .filter((e) => ["withdrawal", "pro_labore", "personal_paid_by_company"].includes(e.type))
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const need = profitability.personalNeed(settings.monthlyPersonalNeed || personalWithdrawals);
  const sustaining = profitability.sustainingCost(business.fixedCost, need);
  const available = profitability.availableResult(business.operationalResult, need);
  const minTarget = profitability.minimumTarget(sustaining, business.contributionMarginRatio);
  const safeTargetValue = profitability.safeTarget(minTarget);
  const growthTargetValue = profitability.growthTarget(minTarget);
  const personalRunway = profitability.runwayMonths(settings.personalCashBalance, need);
  const minHourlyRate = profitability.minimumHourlyRate(sustaining, settings.monthlyCapacityHours);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const proportional = minTarget
    ? profitability.proportionalGoal(minTarget, now.getDate(), daysInMonth)
    : null;

  return {
    personalNeed: need,
    sustainingCost: sustaining,
    availableResult: available,
    minimumTarget: minTarget,
    safeTarget: safeTargetValue,
    growthTarget: growthTargetValue,
    personalRunwayMonths: personalRunway,
    minimumHourlyRate: minHourlyRate,
    proportionalGoalToday: proportional,
  };
}
