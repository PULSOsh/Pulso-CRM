import { eq } from "drizzle-orm";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { personalWorkspaces } from "../db/schema";

/**
 * CRM-F4-01: dupla trava de privacidade. `profitability.read_personal`/
 * `manage_personal` (papel) já restringem a chamada a quem tem o papel
 * `owner` - mas um papel pode em tese ser concedido a mais de um usuário
 * (docs/PRODUCT_VISION.md não impede isso tecnicamente). Esta função exige
 * as duas coisas: papel certo E ser exatamente o `ownerUserId` fixado em
 * `personal_workspaces`. Toda action de finanças pessoais chama isto em vez
 * de requirePermission() diretamente.
 *
 * "Espaço pessoal ainda não foi ativado" é intencional em vez de criar a
 * linha automaticamente aqui - ativar é uma decisão explícita
 * (claimPersonalWorkspace em personal-workspace.ts de actions), não um
 * efeito colateral de qualquer leitura.
 */
/** Pure predicate (sem banco) para o teste negativo de privacidade
 * (CRM-F4-11) poder verificar a trava sem precisar de uma conexão real. */
export function isAuthorizedPersonalOwner(
  workspace: { ownerUserId: string } | null | undefined,
  userId: string,
): boolean {
  return !!workspace && workspace.ownerUserId === userId;
}

export async function requirePersonalAccess(mode: "read" | "manage") {
  const permissionKey =
    mode === "read" ? "profitability.read_personal" : "profitability.manage_personal";
  const { organizationId, userId } = await requirePermission(permissionKey);

  const workspace = await db.query.personalWorkspaces.findFirst({
    where: eq(personalWorkspaces.organizationId, organizationId),
  });
  if (!isAuthorizedPersonalOwner(workspace, userId)) {
    throw new Error(
      workspace
        ? "Acesso restrito ao proprietário do espaço pessoal."
        : "Espaço pessoal ainda não foi ativado.",
    );
  }

  return { organizationId, userId };
}
