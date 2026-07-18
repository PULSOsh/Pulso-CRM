import { db } from "../db/connection";
import { auditLogs } from "../db/schema";

type DbClient = Pick<typeof db, "insert">;

/**
 * Plain internal helper, NOT a server action - same reasoning as
 * logActivity (activity-log.ts): every exported async function in a
 * "use server" file becomes a client-callable RPC endpoint, and this
 * must only ever be called from inside actions that already ran
 * requirePermission() and resolved organizationId/actorUserId server-side.
 *
 * Append-only trail for critical actions (docs/ARCHITECTURE_AND_STANDARDS.md
 * §6/§9: "registro append-only de ações críticas, sem segredos"). Never
 * pass secrets/credentials/tokens in before/after.
 */
export async function writeAuditLog(
  params: {
    organizationId: string;
    actorUserId: string | null;
    action: string;
    entityType?: string;
    entityId?: string;
    before?: unknown;
    after?: unknown;
    ipAddress?: string;
    userAgent?: string;
  },
  dbClient: DbClient = db,
) {
  await dbClient.insert(auditLogs).values({
    organizationId: params.organizationId,
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    beforeData: params.before ?? null,
    afterData: params.after ?? null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}
