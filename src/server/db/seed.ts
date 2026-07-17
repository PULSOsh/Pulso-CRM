import { auth } from "../auth";
import { db } from "./connection";
import { organizationMembers, organizations, permissions, rolePermissions, roles } from "./schema";
import "dotenv/config";

async function runSeed() {
  console.log("🌱 Starting seed...");

  // 1. Create Organization
  const [org] = await db
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
  console.log("✅ Created Organization:", org.name);

  // 2. Create Roles and Permissions
  const [adminRole] = await db
    .insert(roles)
    .values({
      organizationId: org.id,
      name: "Super Administrador",
      key: "admin",
      description: "Acesso total ao sistema",
      isSystem: true,
    })
    .returning();

  const [permAll] = await db
    .insert(permissions)
    .values({
      key: "all_access",
      module: "system",
      action: "manage",
      description: "Acesso global a tudo",
    })
    .returning();

  await db.insert(rolePermissions).values({
    roleId: adminRole.id,
    permissionId: permAll.id,
  });
  console.log("✅ Created Roles and Permissions");

  // 3. Check if user already exists before creating
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, "admin@pulso.cloud"),
  });

  let userId: string;

  if (!existingUser) {
    // We use Better Auth's internal API to create the user with properly hashed password
    const res = await auth.api.signUpEmail({
      body: {
        email: "admin@pulso.cloud",
        password: "pulso_admin_secure",
        name: "Super ADM",
      },
    });

    if (!res.user) {
      throw new Error("Failed to create Super ADM via Better Auth");
    }
    userId = res.user.id;
    console.log("✅ Created Super ADM User");
  } else {
    userId = existingUser.id;
    console.log("✅ Super ADM User already exists");
  }

  // 4. Link User to Organization
  const existingMember = await db.query.organizationMembers.findFirst({
    where: (members, { and, eq }) =>
      and(eq(members.userId, userId), eq(members.organizationId, org.id)),
  });

  if (!existingMember) {
    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: userId,
      roleId: adminRole.id,
      status: "active",
      joinedAt: new Date(),
    });
    console.log("✅ Linked Super ADM to Organization");
  }

  console.log("🎉 Seed finished successfully!");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
