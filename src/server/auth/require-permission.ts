import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "../auth";
import { db } from "../db/connection";
import { organizationMembers, permissions, rolePermissions, roles } from "../db/schema";
import type { PermissionKey } from "./permission-keys";

export class UnauthorizedError extends Error {
  constructor() {
    super("Sessão inválida ou expirada.");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(permissionKey: PermissionKey) {
    super(`Acesso negado: permissão "${permissionKey}" ausente para este usuário.`);
    this.name = "ForbiddenError";
  }
}

export type AuthContext = {
  userId: string;
  organizationId: string;
  memberId: string;
  roleKey: string;
};

/**
 * Resolves the caller's session, active workspace membership and role, and
 * checks the role grants `permissionKey` — all server-side, never trusting
 * any organizationId/role passed in by the client. Denies by default.
 *
 * Every server action that reads or mutates workspace data must call this
 * first and use the returned `organizationId`, not one received as a
 * function argument. See docs/ARCHITECTURE_AND_STANDARDS.md section 5.
 */
export async function requirePermission(permissionKey: PermissionKey): Promise<AuthContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new UnauthorizedError();
  }

  const member = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, session.user.id),
      eq(organizationMembers.status, "active"),
    ),
  });
  if (!member?.roleId) {
    throw new ForbiddenError(permissionKey);
  }

  const role = await db.query.roles.findFirst({
    where: eq(roles.id, member.roleId),
  });
  if (!role) {
    throw new ForbiddenError(permissionKey);
  }

  const rolePerms = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(rolePermissions.roleId, role.id));

  const allowed = rolePerms.some((p) => p.key === permissionKey || p.key === "all_access");
  if (!allowed) {
    throw new ForbiddenError(permissionKey);
  }

  return {
    userId: session.user.id,
    organizationId: member.organizationId,
    memberId: member.id,
    roleKey: role.key,
  };
}
