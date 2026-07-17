import { db } from "./connection";
import { users, roles, permissions, rolePermissions, organizationMembers, organizations, accounts } from "./schema";
import crypto from "crypto";
import { hashPassword } from "better-auth/crypto";
import "dotenv/config";

async function runSeed() {
  console.log("🌱 Starting direct seed...");
  
  // 1. Create Organization
  const orgResult = await db.insert(organizations).values({
    name: "PULSO Cloud",
    slug: "pulso-cloud",
    legalName: "PULSO Tecnologia LTDA",
    documentNumber: "12345678000199",
    email: "contato@pulso.cloud",
    website: "https://pulso.cloud",
  }).returning();
  const orgId = orgResult[0].id;
  console.log("✅ Created Organization");

  // 2. Create Roles & Permissions
  const permissionsList = [
    { key: "all_access", module: "system", action: "manage", description: "Acesso global a tudo" },
  ];
  const createdPerms = await db.insert(permissions).values(permissionsList).returning();
  
  const superAdminRole = await db.insert(roles).values({
    organizationId: orgId,
    name: "Super Admin",
    key: "super_admin",
    description: "Administrador geral do sistema",
    isSystem: true,
  }).returning();

  await db.insert(rolePermissions).values(
    createdPerms.map(p => ({
      roleId: superAdminRole[0].id,
      permissionId: p.id,
    }))
  );
  console.log("✅ Created Roles and Permissions");

  // 3. Create Admin User
  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    name: "Super ADM",
    email: "admin@pulso.cloud",
    emailVerified: false,
  });

  // 4. Create Credential Account
  // Must use better-auth's own hasher (scrypt-based) — bcrypt hashes are rejected
  // by better-auth's verifyPassword with an "Invalid password hash" error.
  const hashedPassword = await hashPassword("pulso_admin_secure");
  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    userId,
    accountId: userId,
    providerId: "credential",
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 5. Add user to Organization
  await db.insert(organizationMembers).values({
    organizationId: orgId,
    userId,
    roleId: superAdminRole[0].id,
    status: "active",
  });

  console.log("✅ Created Admin User: admin@pulso.cloud / pulso_admin_secure");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
