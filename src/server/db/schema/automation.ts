import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { automationRunStatusEnum, automationTriggerEnum } from "./enums";
import { organizations } from "./organizations";
import { outboxEvents } from "./outbox";
import { users } from "./users";

/** CRM-F5-04: `conditions` é uma lista simples de {field, operator, value}
 * avaliada em memória (services/automation.ts), nunca SQL dinâmico a partir
 * de entrada do usuário. `actions` é uma lista de {type, params} restrita
 * ao enum automation_action_type - nunca um tipo de ação livre. */
export const automationRules = pgTable("automation_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  triggerType: automationTriggerEnum("trigger_type").notNull(),
  conditions: jsonb("conditions").notNull().default([]),
  actions: jsonb("actions").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** CRM-F5-04/F5-05: `idempotencyKey` (derivada de regra + evento/contexto,
 * services/automation.ts) garante que a mesma regra nunca executa duas
 * vezes para o mesmo evento (constraint unique) - é o mecanismo real de
 * idempotência do gate da fase, não a tabela idempotency_keys genérica
 * (que segue sem uso real, avaliada e descartada para este caso: aqui a
 * unicidade natural já é regra+evento, um índice único direto é mais
 * simples que reaproveitar aquele esquema de hash de request HTTP). */
export const automationRuns = pgTable(
  "automation_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => automationRules.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => outboxEvents.id, { onDelete: "set null" }),
    idempotencyKey: varchar("idempotency_key", { length: 160 }).notNull(),
    status: automationRunStatusEnum("status").notNull(),
    attempts: integer("attempts").notNull().default(1),
    lastError: text("last_error"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [unique().on(t.ruleId, t.idempotencyKey)],
);
