import { and, eq } from "drizzle-orm";
import { db } from "./db/connection";
import { organizationMembers, permissions, rolePermissions, roles } from "./db/schema";

export async function checkPermission(
  userId: string,
  organizationId: string,
  module: string,
  action: string,
): Promise<boolean> {
  const result = await db
    .select({
      roleIsSystem: roles.isSystem,
      roleKey: roles.key,
      permissionModule: permissions.module,
      permissionAction: permissions.action,
    })
    .from(organizationMembers)
    .innerJoin(roles, eq(organizationMembers.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    );

  if (!result || result.length === 0) {
    return false;
  }

  // System roles usually have full access, or we check specifically
  const userRole = result[0];
  if (userRole.roleIsSystem && userRole.roleKey === "admin") {
    return true; // Super admin bypass
  }

  const hasPermission = result.some(
    (row) => row.permissionModule === module && row.permissionAction === action,
  );

  return hasPermission;
}
