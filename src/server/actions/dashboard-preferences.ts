"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { dashboardWidgetPreferences } from "../db/schema";
import { DASHBOARD_WIDGET_CATALOG } from "../services/dashboard-widgets";

/** Mescla o catálogo fixo com as preferências salvas do usuário -
 * um widget do catálogo sem preferência salva aparece visível, na ordem do
 * catálogo (mesmo default de "tudo ligado" já usado noutros módulos). */
export async function getDashboardPreferences() {
  const { organizationId, userId } = await requirePermission("reports.read");

  const saved = await db.query.dashboardWidgetPreferences.findMany({
    where: and(
      eq(dashboardWidgetPreferences.organizationId, organizationId),
      eq(dashboardWidgetPreferences.userId, userId),
    ),
    orderBy: [asc(dashboardWidgetPreferences.position)],
  });

  const savedByKey = new Map(saved.map((s) => [s.widgetKey, s]));
  const merged = DASHBOARD_WIDGET_CATALOG.map((widget, index) => {
    const pref = savedByKey.get(widget.key);
    return {
      key: widget.key,
      label: widget.label,
      isVisible: pref?.isVisible ?? true,
      position: pref?.position ?? index,
    };
  });

  return merged.sort((a, b) => a.position - b.position);
}

export async function setDashboardWidgetVisibility(widgetKey: string, isVisible: boolean) {
  const { organizationId, userId } = await requirePermission("reports.read");

  await db
    .insert(dashboardWidgetPreferences)
    .values({ organizationId, userId, widgetKey, isVisible })
    .onConflictDoUpdate({
      target: [
        dashboardWidgetPreferences.organizationId,
        dashboardWidgetPreferences.userId,
        dashboardWidgetPreferences.widgetKey,
      ],
      set: { isVisible },
    });

  revalidatePath("/crm/relatorios");
  return { success: true };
}

export async function reorderDashboardWidgets(order: string[]) {
  const { organizationId, userId } = await requirePermission("reports.read");

  await Promise.all(
    order.map((widgetKey, index) =>
      db
        .insert(dashboardWidgetPreferences)
        .values({ organizationId, userId, widgetKey, position: index })
        .onConflictDoUpdate({
          target: [
            dashboardWidgetPreferences.organizationId,
            dashboardWidgetPreferences.userId,
            dashboardWidgetPreferences.widgetKey,
          ],
          set: { position: index },
        }),
    ),
  );

  revalidatePath("/crm/relatorios");
  return { success: true };
}
