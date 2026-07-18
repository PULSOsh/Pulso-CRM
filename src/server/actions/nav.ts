"use server";

import { and, eq, inArray, lt } from "drizzle-orm";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { opportunities, proposals, tasks } from "../db/schema";

export async function getNavBadgeCounts() {
  const { organizationId, userId } = await requirePermission("opportunities.read");

  const [openOpportunities, awaitingProposals, myPendingTasks] = await Promise.all([
    db.query.opportunities.findMany({
      where: and(
        eq(opportunities.organizationId, organizationId),
        eq(opportunities.status, "open"),
      ),
      columns: { id: true },
    }),
    db.query.proposals.findMany({
      where: and(
        eq(proposals.organizationId, organizationId),
        inArray(proposals.status, ["sent", "viewed"]),
      ),
      columns: { id: true },
    }),
    db.query.tasks.findMany({
      where: and(
        eq(tasks.organizationId, organizationId),
        eq(tasks.assignedTo, userId),
        eq(tasks.status, "todo"),
      ),
      columns: { id: true },
    }),
  ]);

  return {
    openOpportunities: openOpportunities.length,
    awaitingProposals: awaitingProposals.length,
    myPendingTasks: myPendingTasks.length,
  };
}

export async function getOverdueAlerts() {
  const { organizationId, userId } = await requirePermission("opportunities.read");

  const now = new Date();

  const [overdueNextActions, overdueTasks] = await Promise.all([
    db.query.opportunities.findMany({
      where: and(
        eq(opportunities.organizationId, organizationId),
        eq(opportunities.status, "open"),
        lt(opportunities.nextActionAt, now),
      ),
      columns: { id: true, title: true, nextActionDescription: true },
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
      columns: { id: true, title: true },
      orderBy: (t, { asc }) => [asc(t.dueAt)],
      limit: 5,
    }),
  ]);

  return {
    overdueNextActions,
    overdueTasks,
    total: overdueNextActions.length + overdueTasks.length,
  };
}
