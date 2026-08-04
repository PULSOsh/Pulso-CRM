"use server";

import { and, eq } from "drizzle-orm";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { organizationMembers, users } from "../db/schema";

/**
 * Primeiro uso real da permissão members.read (catálogo existia desde a
 * Fase 1, sem nenhuma action). Lookup mínimo pra dropdowns de "responsável"
 * (CRM-F2-03) - não é a tela de gestão de membros/convites, que continua
 * pendente.
 */
export async function getOrganizationMembers() {
  const { organizationId } = await requirePermission("members.read");

  const rows = await db
    .select({ userId: users.id, name: users.name, email: users.email })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.status, "active")),
    );

  return rows;
}
