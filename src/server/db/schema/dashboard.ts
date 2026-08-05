import { boolean, integer, pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

/** CRM-F5-07: "configurável" = mostrar/ocultar/ordenar widgets de um
 * catálogo fixo (os relatórios já existentes em reports.ts), por usuário -
 * não é um construtor de métricas novas. `widgetKey` referencia uma chave
 * do catálogo definido em código (services/dashboard-widgets.ts), não uma
 * FK - o catálogo pode crescer sem migração. */
export const dashboardWidgetPreferences = pgTable(
  "dashboard_widget_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    widgetKey: varchar("widget_key", { length: 80 }).notNull(),
    position: integer("position").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
  },
  (t) => [unique().on(t.organizationId, t.userId, t.widgetKey)],
);
