import {
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { products } from "./products";
import { projects } from "./projects";
import { users } from "./users";

/** docs/MODULE_SPECIFICATIONS.md §13 - "Separação" list. */
export const expenseScopeEnum = pgEnum("expense_scope", ["personal", "business", "project"]);

export const expenseTypeEnum = pgEnum("expense_type", [
  "fixed",
  "variable",
  "investment",
  "pro_labore",
  "withdrawal",
  "distribution",
  "reimbursement",
  "contribution",
  "personal_paid_by_company",
]);

export const expenseStatusEnum = pgEnum("expense_status", ["planned", "paid", "cancelled"]);

export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  scope: expenseScopeEnum("scope").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** Módulo confidencial (docs/MODULE_SPECIFICATIONS.md §13): "Comercial e
 * projetos não veem despesas pessoais." Autorização real acontece nas
 * server actions via requirePermission("profitability.read_personal"/
 * "profitability.read_business") - esta tabela por si só não filtra nada,
 * a barreira é sempre no servidor, nunca só na UI. */
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  scope: expenseScopeEnum("scope").notNull(),
  type: expenseTypeEnum("type").notNull(),
  description: varchar("description", { length: 220 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  competenceDate: date("competence_date", { mode: "date" }).notNull(),
  status: expenseStatusEnum("status").notNull().default("planned"),
  paidAt: timestamp("paid_at", { withTimezone: true, mode: "date" }),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** Uma linha "atual" por organização (não versionado) - entradas manuais que
 * as fórmulas de docs/MODULE_SPECIFICATIONS.md §13 usam e que não existem em
 * nenhuma outra tabela do sistema (saldo em caixa, capacidade de horas). */
export const financialSettings = pgTable("financial_settings", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  monthlyPersonalNeed: numeric("monthly_personal_need", { precision: 14, scale: 2 }),
  businessCashBalance: numeric("business_cash_balance", { precision: 14, scale: 2 }),
  personalCashBalance: numeric("personal_cash_balance", { precision: 14, scale: 2 }),
  monthlyCapacityHours: numeric("monthly_capacity_hours", { precision: 6, scale: 1 }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
