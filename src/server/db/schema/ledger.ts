import {
  type AnyPgColumn,
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
import { expenseCategories } from "./costs";
import {
  financialRecurrenceTargetEnum,
  financialTransactionDirectionEnum,
  financialTransactionKindEnum,
  installmentStatusEnum,
  payableStatusEnum,
  taskRecurrenceFrequencyEnum,
} from "./enums";
import { financialAccounts } from "./finance";
import { organizations } from "./organizations";
import { projects } from "./projects";
import { users } from "./users";

/** CRM-F3-03: plano de contas por centro de custo, ortogonal às categorias
 * (expenseCategories) já existentes. */
export const costCenters = pgTable(
  "cost_centers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 140 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.organizationId, t.name)],
);

/** CRM-F3-04: contas a pagar, mesmo padrão de receivables (cabeçalho +
 * parcelas em tabela própria) para reaproveitar a lógica de baixa/estorno. */
export const payables = pgTable("payables", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  vendorCompanyId: uuid("vendor_company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  categoryId: uuid("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
  costCenterId: uuid("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  description: varchar("description", { length: 220 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  status: payableStatusEnum("status").notNull().default("open"),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const payableInstallments = pgTable(
  "payable_installments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    payableId: uuid("payable_id")
      .notNull()
      .references(() => payables.id, { onDelete: "cascade" }),
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
    unique().on(t.payableId, t.installmentNumber),
    index("payable_installments_due_status_idx").on(t.status, t.dueDate),
  ],
);

/** CRM-F3-05/F3-06/F3-09/F3-10/F3-11: razão único de movimentações de caixa.
 * `sourceType`/`sourceId` são polimórficos (mesmo padrão de
 * attachments.entityType/entityId) em vez de duas FKs nulas separadas para
 * parcela de recebível/pagável. Nunca editado após criado - um estorno é uma
 * nova linha com `direction` invertida, não uma atualização da linha original
 * ("histórico confiável"). */
export const financialTransactions = pgTable(
  "financial_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: "set null" }),
    kind: financialTransactionKindEnum("kind").notNull(),
    direction: financialTransactionDirectionEnum("direction").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    categoryId: uuid("category_id").references(() => expenseCategories.id, {
      onDelete: "set null",
    }),
    costCenterId: uuid("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
    sourceType: varchar("source_type", { length: 30 }),
    sourceId: uuid("source_id"),
    transferGroupId: uuid("transfer_group_id"),
    description: varchar("description", { length: 220 }).notNull(),
    notes: text("notes"),
    reconciledAt: timestamp("reconciled_at", { withTimezone: true, mode: "date" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("financial_transactions_org_date_idx").on(t.organizationId, t.occurredAt),
    index("financial_transactions_source_idx").on(t.sourceType, t.sourceId),
  ],
);

/** CRM-F3-06 (parcial): divisão de uma transação entre categorias/centros de
 * custo distintos. Quando ausente, a transação usa seus próprios
 * categoryId/costCenterId como o único "split" implícito. */
export const transactionSplits = pgTable("transaction_splits", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references((): AnyPgColumn => financialTransactions.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
  costCenterId: uuid("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** CRM-F3-07: sem motor de automação/job agendado nesta fase (Fase 5 do
 * plano mestre) - `nextRunDate` é avançado manualmente por uma action
 * "gerar próxima ocorrência", chamada sob demanda pela equipe. */
export const financialRecurrenceRules = pgTable("financial_recurrence_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  targetType: financialRecurrenceTargetEnum("target_type").notNull(),
  frequency: taskRecurrenceFrequencyEnum("frequency").notNull(),
  dayOfMonth: integer("day_of_month"),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }),
  nextRunDate: date("next_run_date", { mode: "date" }).notNull(),
  description: varchar("description", { length: 220 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  vendorCompanyId: uuid("vendor_company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  clientCompanyId: uuid("client_company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  categoryId: uuid("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
  costCenterId: uuid("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  lastGeneratedAt: timestamp("last_generated_at", { withTimezone: true, mode: "date" }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** CRM-F3-08: metadados do arquivo importado. */
export const bankImports = pgTable("bank_imports", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: "set null" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  format: varchar("format", { length: 10 }).notNull(),
  importedBy: uuid("imported_by").references(() => users.id, { onDelete: "set null" }),
  importedAt: timestamp("imported_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  totalLines: integer("total_lines").notNull().default(0),
  matchedLines: integer("matched_lines").notNull().default(0),
});

/** CRM-F3-08/F3-09: uma linha por lançamento do extrato. `externalId` é o
 * FITID do OFX (dedupe de reimportação); `matchedTransactionId` é a
 * conciliação com o razão (F3-09). */
export const bankImportLines = pgTable(
  "bank_import_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bankImportId: uuid("bank_import_id")
      .notNull()
      .references(() => bankImports.id, { onDelete: "cascade" }),
    lineDate: date("line_date", { mode: "date" }).notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    externalId: varchar("external_id", { length: 120 }),
    matchedTransactionId: uuid("matched_transaction_id").references(
      (): AnyPgColumn => financialTransactions.id,
      { onDelete: "set null" },
    ),
    status: varchar("status", { length: 20 }).notNull().default("unmatched"),
    matchedAt: timestamp("matched_at", { withTimezone: true, mode: "date" }),
    matchedBy: uuid("matched_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("bank_import_lines_import_idx").on(t.bankImportId)],
);
