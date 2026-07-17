import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const integrationConnections = pgTable("integration_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 80 }).notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("inactive"),
  credentialsEncrypted: text("credentials_encrypted"),
  settings: jsonb("settings").notNull().default({}),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
