"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { notifications } from "../db/schema";

export async function getMyNotifications() {
  const { organizationId, userId } = await requirePermission("dashboard.read");

  return db.query.notifications.findMany({
    where: and(eq(notifications.organizationId, organizationId), eq(notifications.userId, userId)),
    orderBy: [desc(notifications.createdAt)],
    limit: 20,
  });
}

export async function getUnreadNotificationCount() {
  const { organizationId, userId } = await requirePermission("dashboard.read");

  const rows = await db.query.notifications.findMany({
    where: and(
      eq(notifications.organizationId, organizationId),
      eq(notifications.userId, userId),
      isNull(notifications.readAt),
    ),
    columns: { id: true },
  });

  return rows.length;
}

export async function markNotificationRead(id: string) {
  const { organizationId, userId } = await requirePermission("dashboard.read");

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
      ),
    );

  revalidatePath("/crm");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const { organizationId, userId } = await requirePermission("dashboard.read");

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    );

  revalidatePath("/crm");
  return { success: true };
}
