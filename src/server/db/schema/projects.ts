import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { contacts } from "./contacts";
import { projectStatusEnum } from "./enums";
import { opportunities } from "./opportunities";
import { organizations } from "./organizations";
import { users } from "./users";

export const projectStages = pgTable(
  "project_stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    position: integer("position").notNull(),
    color: varchar("color", { length: 16 }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [unique().on(t.organizationId, t.position)],
);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
    onDelete: "set null",
  }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  primaryContactId: uuid("primary_contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  stageId: uuid("stage_id").references(() => projectStages.id, { onDelete: "set null" }),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 220 }).notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("planned"),
  totalValue: numeric("total_value", { precision: 14, scale: 2 }).notNull().default("0"),
  startDate: date("start_date", { mode: "date" }),
  dueDate: date("due_date", { mode: "date" }),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  progress: smallint("progress").notNull().default(0),
  productionUrl: text("production_url"),
  publishedUrl: text("published_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const projectChecklistItems = pgTable("project_checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedBy: uuid("completed_by").references(() => users.id, { onDelete: "set null" }),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 40 }).notNull().default("pending"),
  publicToken: uuid("public_token").notNull().defaultRandom().unique(),
  requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
  decidedByName: varchar("decided_by_name", { length: 180 }),
  decisionNotes: text("decision_notes"),
  evidence: jsonb("evidence").notNull().default({}),
});
