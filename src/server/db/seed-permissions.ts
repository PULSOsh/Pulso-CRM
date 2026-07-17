import { and, eq } from "drizzle-orm";
import { PERMISSION_KEYS, ROLE_KEYS, ROLE_PERMISSIONS } from "../auth/permission-keys";
import { db } from "./connection";
import { permissions, rolePermissions, roles } from "./schema";

/**
 * Idempotent: safe to run more than once. Creates/updates the permission
 * catalog and the 6 roles for a workspace, without deleting or duplicating
 * anything. If a legacy "super_admin" role exists (from the original seed),
 * it's renamed in place to "owner" instead of creating a duplicate role and
 * leaving existing members pointed at the stale one.
 */
export async function seedPermissionsAndRoles(organizationId: string) {
  // 1. Permission catalog (global, not per-organization)
  const existingPerms = await db.query.permissions.findMany();
  const existingPermKeys = new Set(existingPerms.map((p) => p.key));

  const missingPerms = PERMISSION_KEYS.filter((key) => !existingPermKeys.has(key)).map((key) => {
    const [module, action] = key.split(".");
    return { key, module, action };
  });

  if (missingPerms.length > 0) {
    await db.insert(permissions).values(missingPerms);
    console.log(`✅ Inserted ${missingPerms.length} missing permission(s)`);
  }

  const allPerms = await db.query.permissions.findMany();
  const permIdByKey = new Map(allPerms.map((p) => [p.key, p.id]));

  // 2. Legacy role migration: super_admin -> owner (rename in place)
  const legacyRole = await db.query.roles.findFirst({
    where: and(eq(roles.key, "super_admin"), eq(roles.organizationId, organizationId)),
  });
  if (legacyRole) {
    await db.update(roles).set({ key: "owner", name: "Owner" }).where(eq(roles.id, legacyRole.id));
    console.log("✅ Renamed legacy super_admin role to owner");
  }

  // 3. Roles for this organization (idempotent)
  for (const roleKey of ROLE_KEYS) {
    let role = await db.query.roles.findFirst({
      where: and(eq(roles.key, roleKey), eq(roles.organizationId, organizationId)),
    });

    if (!role) {
      const [inserted] = await db
        .insert(roles)
        .values({
          organizationId,
          key: roleKey,
          name: roleKey.charAt(0).toUpperCase() + roleKey.slice(1),
          isSystem: true,
        })
        .returning();
      if (!inserted) throw new Error(`Falha ao criar o papel ${roleKey}`);
      role = inserted;
      console.log(`✅ Created role ${roleKey}`);
    }

    // 4. Role -> permission grants (add missing, never remove)
    const existingGrants = await db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, role.id),
    });
    const grantedPermIds = new Set(existingGrants.map((g) => g.permissionId));

    const wantedKeys = ROLE_PERMISSIONS[roleKey];
    const missingGrants = wantedKeys
      .map((key) => permIdByKey.get(key))
      .filter((id): id is string => !!id && !grantedPermIds.has(id))
      .map((permissionId) => ({ roleId: role.id, permissionId }));

    if (missingGrants.length > 0) {
      await db.insert(rolePermissions).values(missingGrants);
      console.log(`✅ Granted ${missingGrants.length} permission(s) to ${roleKey}`);
    }
  }
}
