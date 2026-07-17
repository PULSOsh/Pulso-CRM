import { hashPassword } from "better-auth/crypto";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./connection";
import {
  accounts,
  organizationMembers,
  organizations,
  permissions,
  rolePermissions,
  roles,
  users,
} from "./schema";
import "dotenv/config";

const ADMIN_NAME = process.env.SEED_ADMIN_NAME;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function runSeed() {
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "SEED_ADMIN_NAME, SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD são obrigatórias para rodar o seed. Defina-as no .env (nunca no código).",
    );
  }

  console.log("🌱 Starting direct seed...");

  // 1. Create Organization (idempotent - reuse if it already exists)
  let organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "pulso-cloud"),
  });

  if (!organization) {
    const [inserted] = await db
      .insert(organizations)
      .values({
        name: "PULSO Cloud",
        slug: "pulso-cloud",
        legalName: "PULSO Tecnologia LTDA",
        documentNumber: "12345678000199",
        email: "contato@pulso.cloud",
        website: "https://pulso.cloud",
      })
      .returning();
    organization = inserted;
    console.log("✅ Created Organization");
  } else {
    console.log("↷ Organization already exists, skipping");
  }
  const orgId = organization.id;

  // 2. Create Roles & Permissions (idempotent)
  let superAdminRole = await db.query.roles.findFirst({
    where: eq(roles.key, "super_admin"),
  });

  if (!superAdminRole) {
    const permissionsList = [
      {
        key: "all_access",
        module: "system",
        action: "manage",
        description: "Acesso global a tudo",
      },
    ];
    const createdPerms = await db.insert(permissions).values(permissionsList).returning();

    const [insertedRole] = await db
      .insert(roles)
      .values({
        organizationId: orgId,
        name: "Super Admin",
        key: "super_admin",
        description: "Administrador geral do sistema",
        isSystem: true,
      })
      .returning();
    if (!insertedRole) {
      throw new Error("Falha ao criar o papel super_admin");
    }
    superAdminRole = insertedRole;

    const roleId = superAdminRole.id;
    await db.insert(rolePermissions).values(
      createdPerms.map((p) => ({
        roleId,
        permissionId: p.id,
      })),
    );
    console.log("✅ Created Roles and Permissions");
  } else {
    console.log("↷ Roles already exist, skipping");
  }
  if (!superAdminRole) {
    throw new Error("Papel super_admin ausente após etapa de criação");
  }

  // 3. Create Admin User (idempotent)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_EMAIL),
  });

  if (existingUser) {
    console.log(`↷ Admin user ${ADMIN_EMAIL} already exists, skipping`);
    process.exit(0);
  }

  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    emailVerified: false,
  });

  // 4. Create Credential Account
  // Must use better-auth's own hasher (scrypt-based) — bcrypt hashes are rejected
  // by better-auth's verifyPassword with an "Invalid password hash" error.
  const hashedPassword = await hashPassword(ADMIN_PASSWORD);
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
    roleId: superAdminRole.id,
    status: "active",
  });

  console.log(`✅ Created Admin User: ${ADMIN_EMAIL}`);
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
