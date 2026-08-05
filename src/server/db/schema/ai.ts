import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { aiSuggestionStatusEnum } from "./enums";
import { organizations } from "./organizations";
import { users } from "./users";

/** CRM-F5-08: toda chamada de IA fica registrada aqui, `status` sempre
 * começa "pending" e só muda por ação humana explícita
 * (acceptAiSuggestion/rejectAiSuggestion) - nunca é aplicada sozinha
 * (docs/PLANO_MESTRE_EVOLUCAO_CRM.md §5 Módulo O). `inputSummary` guarda só
 * o que foi de fato enviado ao modelo (nunca dado financeiro/pessoal sem
 * necessidade explícita, CLAUDE.md §7), para auditoria do que saiu do
 * sistema. */
export const aiSuggestions = pgTable("ai_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 60 }).notNull(),
  entityType: varchar("entity_type", { length: 40 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  inputSummary: text("input_summary").notNull(),
  suggestion: jsonb("suggestion").notNull(),
  status: aiSuggestionStatusEnum("status").notNull().default("pending"),
  requestedBy: uuid("requested_by").references(() => users.id, { onDelete: "set null" }),
  decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
