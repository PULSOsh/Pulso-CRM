import { boolean, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * CRM-F1-02: docs/PLANO_MESTRE_EVOLUCAO_CRM.md §6 já lista
 * `pipeline_loss_reasons` como entidade nova prioritária. Antes desta story,
 * `opportunities.lostReason` era só texto livre - sem lista gerenciável, sem
 * como agregar motivos de perda de forma consistente em relatórios.
 */
export const pipelineLossReasons = pgTable(
  "pipeline_loss_reasons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.organizationId, t.label)],
);
