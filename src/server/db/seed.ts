import crypto from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./connection";
import { accounts, organizationMembers, organizations, roles, users } from "./schema";
import { seedPermissionsAndRoles } from "./seed-permissions";
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
        email: ADMIN_EMAIL,
        website: "https://pulsosh.cloud",
      })
      .returning();
    organization = inserted;
    console.log("✅ Created Organization");
  } else {
    console.log("↷ Organization already exists, skipping");
  }
  const orgId = organization.id;

  // 2. Create the full permission catalog and the 6 roles (idempotent).
  // Also renames a legacy "super_admin" role to "owner" in place if found,
  // so any existing membership keeps working without a manual migration.
  await seedPermissionsAndRoles(orgId);

  const ownerRole = await db.query.roles.findFirst({
    where: and(eq(roles.key, "owner"), eq(roles.organizationId, orgId)),
  });
  if (!ownerRole) {
    throw new Error("Papel owner ausente após seedPermissionsAndRoles");
  }

  // 3. Create or reuse Admin User
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_EMAIL),
  });
  const userId = existingUser?.id ?? crypto.randomUUID();

  if (!existingUser) {
    await db.insert(users).values({
      id: userId,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      emailVerified: false,
    });
    console.log(`✅ Created Admin User: ${ADMIN_EMAIL}`);
  } else {
    console.log(`↷ Admin user ${ADMIN_EMAIL} already exists, reusing`);
  }

  // 4. Create Credential Account only when missing. Existing passwords are preserved.
  // Must use better-auth's own hasher (scrypt-based) — bcrypt hashes are rejected
  // by better-auth's verifyPassword with an "Invalid password hash" error.
  const credentialAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")),
  });

  if (!credentialAccount) {
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
    console.log("✅ Created credential account");
  } else {
    console.log("↷ Credential account already exists, preserving password");
  }

  // 5. Create or repair the owner's organization membership.
  const existingMembership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, orgId),
      eq(organizationMembers.userId, userId),
    ),
  });

  const now = new Date();
  if (existingMembership) {
    await db
      .update(organizationMembers)
      .set({
        roleId: ownerRole.id,
        status: "active",
        joinedAt: existingMembership.joinedAt ?? now,
        updatedAt: now,
      })
      .where(eq(organizationMembers.id, existingMembership.id));
    console.log("✅ Repaired owner membership");
  } else {
    await db.insert(organizationMembers).values({
      organizationId: orgId,
      userId,
      roleId: ownerRole.id,
      status: "active",
      joinedAt: now,
    });
    console.log("✅ Created owner membership");
  }

  console.log(`✅ Seed completed for: ${ADMIN_EMAIL}`);
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
