import { db } from "../db/connection";
import { notifications } from "../db/schema";

type DbClient = Pick<typeof db, "insert">;

/**
 * Plain internal helper, NOT a server action - same reasoning as
 * logActivity/writeAuditLog. Only channel "in_app" for now
 * (docs/STEP_BY_STEP_IMPLEMENTATION.md Fase 7: "começar só por canal
 * in_app, não expandir pra e-mail/WhatsApp sem necessidade comprovada").
 */
export async function notifyUser(
  params: {
    organizationId: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
    actionUrl?: string;
  },
  dbClient: DbClient = db,
) {
  await dbClient.insert(notifications).values({
    organizationId: params.organizationId,
    userId: params.userId,
    channel: "in_app",
    type: params.type,
    title: params.title,
    body: params.body,
    actionUrl: params.actionUrl,
    sentAt: new Date(),
  });
}
