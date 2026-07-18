"use server";

import { and, eq, inArray, lt } from "drizzle-orm";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { installments, opportunities, proposals, receivables, tasks } from "../db/schema";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const STALE_PROPOSAL_DAYS = 3;

export async function getDashboardData() {
  const { organizationId, userId } = await requirePermission("opportunities.read");
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - NINETY_DAYS_MS);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const staleProposalCutoff = new Date(now.getTime() - STALE_PROPOSAL_DAYS * 24 * 60 * 60 * 1000);

  const [
    openOpportunities,
    recentDecidedOpportunities,
    orgReceivables,
    overdueNextActions,
    overdueTasks,
    staleProposals,
  ] = await Promise.all([
    db.query.opportunities.findMany({
      where: and(
        eq(opportunities.organizationId, organizationId),
        eq(opportunities.status, "open"),
      ),
      columns: { id: true, estimatedValue: true },
    }),
    db.query.opportunities.findMany({
      where: and(
        eq(opportunities.organizationId, organizationId),
        inArray(opportunities.status, ["won", "lost"]),
      ),
      columns: { id: true, status: true, wonAt: true, lostAt: true },
    }),
    db.query.receivables.findMany({
      where: eq(receivables.organizationId, organizationId),
      columns: { id: true },
    }),
    db.query.opportunities.findMany({
      where: and(
        eq(opportunities.organizationId, organizationId),
        eq(opportunities.status, "open"),
        lt(opportunities.nextActionAt, now),
      ),
      columns: { id: true, title: true, nextActionDescription: true, nextActionAt: true },
      orderBy: (o, { asc }) => [asc(o.nextActionAt)],
      limit: 5,
    }),
    db.query.tasks.findMany({
      where: and(
        eq(tasks.organizationId, organizationId),
        eq(tasks.assignedTo, userId),
        eq(tasks.status, "todo"),
        lt(tasks.dueAt, now),
      ),
      columns: { id: true, title: true, dueAt: true },
      orderBy: (t, { asc }) => [asc(t.dueAt)],
      limit: 5,
    }),
    db.query.proposals.findMany({
      where: and(
        eq(proposals.organizationId, organizationId),
        inArray(proposals.status, ["sent", "viewed"]),
        lt(proposals.createdAt, staleProposalCutoff),
      ),
      columns: { id: true, title: true, createdAt: true },
      orderBy: (p, { asc }) => [asc(p.createdAt)],
      limit: 5,
    }),
  ]);

  const receivableIds = orgReceivables.map((r) => r.id);
  const allInstallments =
    receivableIds.length > 0
      ? await db.query.installments.findMany({
          where: inArray(installments.receivableId, receivableIds),
        })
      : [];

  const overdueInstallments = allInstallments
    .filter((i) => i.status === "overdue" || (i.status === "pending" && i.dueDate < now))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  const pipelineOpenValue = openOpportunities.reduce((acc, o) => acc + Number(o.estimatedValue), 0);

  const recentDecided90d = recentDecidedOpportunities.filter((o) => {
    const decidedAt = o.status === "won" ? o.wonAt : o.lostAt;
    return decidedAt && decidedAt >= ninetyDaysAgo;
  });
  const wonCount90d = recentDecided90d.filter((o) => o.status === "won").length;
  const conversionRate =
    recentDecided90d.length > 0 ? (wonCount90d / recentDecided90d.length) * 100 : null;

  const receivedThisMonth = allInstallments
    .filter(
      (i) =>
        i.status === "paid" && i.paidAt && i.paidAt >= startOfMonth && i.paidAt < startOfNextMonth,
    )
    .reduce((acc, i) => acc + Number(i.paidAmount ?? i.amount), 0);
  const pendingTotal = allInstallments
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((acc, i) => acc + Number(i.amount), 0);

  return {
    pipelineOpenValue,
    pipelineOpenCount: openOpportunities.length,
    conversionRate,
    receivedThisMonth,
    pendingTotal,
    attention: {
      overdueNextActions,
      overdueTasks,
      overdueInstallments,
      staleProposals,
      total:
        overdueNextActions.length +
        overdueTasks.length +
        overdueInstallments.length +
        staleProposals.length,
    },
  };
}
