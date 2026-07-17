import { boolean, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { briefingSubmissions } from "./briefings";
import { organizations } from "./organizations";
import { proposals } from "./proposals";

export const consentRecords = pgTable("consent_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  submissionId: uuid("submission_id").references(() => briefingSubmissions.id, {
    onDelete: "set null",
  }),
  proposalId: uuid("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
  consentKey: varchar("consent_key", { length: 120 }).notNull(),
  purpose: varchar("purpose", { length: 220 }).notNull(),
  textVersion: varchar("text_version", { length: 40 }).notNull(),
  textSnapshot: text("text_snapshot").notNull(),
  granted: boolean("granted").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  grantedAt: timestamp("granted_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  metadata: jsonb("metadata").notNull().default({}),
});
