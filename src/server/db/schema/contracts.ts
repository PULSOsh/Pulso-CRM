import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { contractStatusEnum } from "./enums";
import { opportunities } from "./opportunities";
import { organizations } from "./organizations";
import { proposals } from "./proposals";
import { users } from "./users";

export const contractTemplates = pgTable("contract_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 120 }),
  content: text("content").notNull(),
  variables: jsonb("variables").notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    proposalId: uuid("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    templateId: uuid("template_id").references(() => contractTemplates.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    code: varchar("code", { length: 40 }).notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    status: contractStatusEnum("status").notNull().default("draft"),
    content: text("content").notNull(),
    publicToken: uuid("public_token").notNull().defaultRandom().unique(),
    publicAccessEnabled: boolean("public_access_enabled").notNull().default(false),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
    signedAt: timestamp("signed_at", { withTimezone: true, mode: "date" }),
    signerName: varchar("signer_name", { length: 180 }),
    signerDocument: varchar("signer_document", { length: 32 }),
    signerIp: text("signer_ip"),
    signerUserAgent: text("signer_user_agent"),
    signatureEvidence: jsonb("signature_evidence").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.organizationId, t.code)],
);

export const contractEvents = pgTable("contract_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id")
    .notNull()
    .references(() => contracts.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 60 }).notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
