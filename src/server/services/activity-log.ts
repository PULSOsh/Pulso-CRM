import { db } from "../db/connection";
import { activities } from "../db/schema";
import type { activityTypeEnum } from "../db/schema/enums";

type ActivityType = (typeof activityTypeEnum.enumValues)[number];
type DbClient = Pick<typeof db, "insert">;

/**
 * Plain internal helper, NOT a server action - deliberately not in a
 * "use server" file, since every exported async function in one becomes a
 * client-callable RPC endpoint. This is only ever called from inside actions
 * that have already run requirePermission() and resolved organizationId/
 * userId server-side; it never resolves its own auth context.
 *
 * Accepts an optional db/transaction client so callers running inside
 * db.transaction(async (tx) => ...) can pass `tx` and keep the activity
 * row atomic with whatever else the transaction is doing - passing the
 * plain `db` here from inside a transaction would write outside it.
 */
export async function logActivity(
  params: {
    organizationId: string;
    actorUserId: string | null;
    type: ActivityType;
    title: string;
    body?: string;
    opportunityId?: string;
    companyId?: string;
    contactId?: string;
  },
  dbClient: DbClient = db,
) {
  await dbClient.insert(activities).values({
    organizationId: params.organizationId,
    actorUserId: params.actorUserId,
    type: params.type,
    title: params.title,
    body: params.body,
    opportunityId: params.opportunityId,
    companyId: params.companyId,
    contactId: params.contactId,
  });
}
