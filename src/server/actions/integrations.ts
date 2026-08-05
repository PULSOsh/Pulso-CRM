"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { integrationConnections } from "../db/schema";
import { integrationConnectionSchema } from "./integrations.schemas";

/** CRM-F5-09: primeiro uso real de `integration_connections` (existia desde
 * a migration 0000, sem nenhuma action). Só o provedor "webhook" está
 * implementado nesta fase - é o único tipo de integração que o motor de
 * automações (F5-04, ação `send_webhook`) sabe consumir. `credentialsEncrypted`
 * fica sempre nulo aqui: uma URL de webhook não é segredo do sistema, é
 * configuração da organização; um provedor futuro que exija token OAuth
 * precisará de uma decisão própria de criptografia em repouso antes de
 * usar essa coluna - não fabricada aqui. */
export async function getIntegrationConnections() {
  const { organizationId } = await requirePermission("integrations.manage");

  return db.query.integrationConnections.findMany({
    where: eq(integrationConnections.organizationId, organizationId),
    orderBy: [desc(integrationConnections.createdAt)],
  });
}

export async function createWebhookIntegration(input: unknown) {
  const { organizationId } = await requirePermission("integrations.manage");
  const parsed = integrationConnectionSchema.parse(input);

  const [connection] = await db
    .insert(integrationConnections)
    .values({
      organizationId,
      provider: "webhook",
      name: parsed.name,
      status: "active",
      settings: { url: parsed.url },
    })
    .returning();

  revalidatePath("/crm/automacoes");
  return connection;
}

export async function setIntegrationConnectionStatus(id: string, status: "active" | "inactive") {
  const { organizationId } = await requirePermission("integrations.manage");

  const [updated] = await db
    .update(integrationConnections)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(integrationConnections.id, id),
        eq(integrationConnections.organizationId, organizationId),
      ),
    )
    .returning({ id: integrationConnections.id });
  if (!updated) throw new Error("Integração não encontrada.");

  revalidatePath("/crm/automacoes");
  return { success: true };
}
