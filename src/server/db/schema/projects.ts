import {
  type AnyPgColumn,
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
import { contracts } from "./contracts";
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
  contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "set null" }),
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
  // CRM-F2-07: portal do cliente - token público revogável, mesmo padrão já
  // usado em proposta/contrato/aprovação (uuid + enabled), não uma conta de
  // cliente com login.
  clientPortalToken: uuid("client_portal_token").notNull().defaultRandom().unique(),
  clientPortalEnabled: boolean("client_portal_enabled").notNull().default(false),
  // CRM-F2-08: encerramento e satisfação. completedAt (já existia, nunca era
  // escrito) passa a marcar o encerramento; os campos de satisfação são
  // preenchidos pelo cliente via o mesmo token do portal.
  closedNotes: text("closed_notes"),
  satisfactionScore: smallint("satisfaction_score"),
  satisfactionComment: text("satisfaction_comment"),
  satisfactionRequestedAt: timestamp("satisfaction_requested_at", {
    withTimezone: true,
    mode: "date",
  }),
  satisfactionRespondedAt: timestamp("satisfaction_responded_at", {
    withTimezone: true,
    mode: "date",
  }),
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
  // CRM-F2-03: responsável pelo item (distinto de completedBy - quem deveria
  // fazer vs. quem de fato concluiu).
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// CRM-F2-01: template reaproveitável de checklist de projeto - evita recriar
// a mesma lista de tarefas toda vez que um novo tipo de projeto for gerado.
export const projectTemplates = pgTable(
  "project_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.organizationId, t.name)],
);

export const projectTemplateChecklistItems = pgTable("project_template_checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => projectTemplates.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  position: integer("position").notNull().default(0),
});

// CRM-F2-02: marcos com dependência simples (um marco não pode ser concluído
// enquanto o marco do qual depende não estiver concluído).
export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  dueDate: date("due_date", { mode: "date" }),
  position: integer("position").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  dependsOnMilestoneId: uuid("depends_on_milestone_id").references((): AnyPgColumn => milestones.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// CRM-F2-04: apontamento de horas por projeto.
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  workDate: date("work_date", { mode: "date" }).notNull(),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// CRM-F2-06: alteração de escopo - pedido de mudança com impacto em valor/
// prazo, decidido separadamente das aprovações genéricas (que não têm esses
// campos estruturados).
export const projectScopeChanges = pgTable("project_scope_changes", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description"),
  valueDelta: numeric("value_delta", { precision: 14, scale: 2 }).notNull().default("0"),
  deadlineDeltaDays: integer("deadline_delta_days"),
  status: varchar("status", { length: 40 }).notNull().default("pending"),
  requestedBy: uuid("requested_by").references(() => users.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
  decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
  decisionNotes: text("decision_notes"),
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
