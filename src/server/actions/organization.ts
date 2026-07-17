import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { organizationMembers } from "../db/schema";

export async function getActiveOrganizationId(userId: string): Promise<string> {
  const member = await db.query.organizationMembers.findFirst({
    where: eq(organizationMembers.userId, userId),
  });

  if (!member) {
    throw new Error("Usuário não pertence a nenhuma organização");
  }

  return member.organizationId;
}
