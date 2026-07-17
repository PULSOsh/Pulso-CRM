import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { contacts } from "./contacts";
import { installmentStatusEnum } from "./enums";
import { opportunities } from "./opportunities";
import { organizations } from "./organizations";
import { projects } from "./projects";

export const financialAccounts = pgTable("financial_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  accountType: varchar("account_type", { length: 60 }),
  institution: varchar("institution", { length: 120 }),
  pixKeyType: varchar("pix_key_type", { length: 30 }),
  pixKeyMasked: varchar("pix_key_masked", { length: 120 }),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const receivables = pgTable("receivables", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
    onDelete: "set null",
  }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  description: varchar("description", { length: 220 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const installments = pgTable(
  "installments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    receivableId: uuid("receivable_id")
      .notNull()
      .references(() => receivables.id, { onDelete: "cascade" }),
    installmentNumber: integer("installment_number").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    dueDate: date("due_date", { mode: "date" }).notNull(),
    status: installmentStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "date" }),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }),
    paymentMethod: varchar("payment_method", { length: 80 }),
    accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.receivableId, t.installmentNumber),
    index("installments_due_status_idx").on(t.status, t.dueDate),
  ],
);
