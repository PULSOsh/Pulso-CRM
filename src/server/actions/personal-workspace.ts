"use server";

import { eq } from "drizzle-orm";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { personalWorkspaces, users } from "../db/schema";
import { requirePersonalAccess } from "../services/personal-workspace";

/** Não lança se ainda não foi ativado - a UI usa isso para decidir entre
 * mostrar "Ativar meu espaço pessoal" ou o módulo completo. */
export async function getPersonalWorkspace() {
  const { organizationId, userId } = await requirePermission("profitability.read_personal");

  const workspace = await db.query.personalWorkspaces.findFirst({
    where: eq(personalWorkspaces.organizationId, organizationId),
  });
  if (!workspace) return { active: false as const };

  return {
    active: true as const,
    isOwner: workspace.ownerUserId === userId,
    createdAt: workspace.createdAt,
  };
}

/** CRM-F4-01: primeiro usuário com o papel `owner` a chamar isto se torna o
 * proprietário fixo do espaço pessoal - a partir daí, mesmo outro usuário
 * com papel `owner` não consegue acessar (requirePersonalAccess exige o
 * `ownerUserId` exato, não só o papel). */
export async function claimPersonalWorkspace() {
  const { organizationId, userId } = await requirePermission("profitability.manage_personal");

  const existing = await db.query.personalWorkspaces.findFirst({
    where: eq(personalWorkspaces.organizationId, organizationId),
  });
  if (existing) {
    if (existing.ownerUserId !== userId) {
      throw new Error("O espaço pessoal já está vinculado a outro usuário.");
    }
    return { success: true };
  }

  await db.insert(personalWorkspaces).values({ organizationId, ownerUserId: userId });
  return { success: true };
}

/** Só o proprietário atual pode transferir - evita que qualquer papel
 * `owner` reatribua o espaço de outra pessoa sem o dono saber. */
export async function reassignPersonalWorkspace(newOwnerUserId: string) {
  const { organizationId } = await requirePersonalAccess("manage");

  const target = await db.query.users.findFirst({ where: eq(users.id, newOwnerUserId) });
  if (!target) throw new Error("Usuário não encontrado.");

  await db
    .update(personalWorkspaces)
    .set({ ownerUserId: newOwnerUserId })
    .where(eq(personalWorkspaces.organizationId, organizationId));

  return { success: true };
}
