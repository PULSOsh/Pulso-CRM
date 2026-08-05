import { db } from "../db/connection";
import { outboxEvents } from "../db/schema";

type DbClient = Pick<typeof db, "insert">;

/**
 * Plain internal helper, NOT a server action (mesmo motivo de logActivity/
 * writeAuditLog/postFinancialTransaction). CRM-F5-04/F5-05: registra um
 * evento de domínio já significativo (não "qualquer mudança de qualquer
 * tabela") para o motor de automações consumir depois, via
 * processPendingAutomations() - nunca dispara nada sincronamente daqui.
 */
export async function enqueueOutboxEvent(
  params: {
    organizationId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  },
  dbClient: DbClient = db,
) {
  await dbClient.insert(outboxEvents).values({
    organizationId: params.organizationId,
    eventType: params.eventType,
    aggregateType: params.aggregateType,
    aggregateId: params.aggregateId,
    payload: params.payload,
  });
}
