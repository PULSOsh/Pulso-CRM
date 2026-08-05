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
import {
  payableStatusEnum,
  personalCategoryKindEnum,
  personalTransactionKindEnum,
  taskRecurrenceFrequencyEnum,
} from "./enums";
import { organizations } from "./organizations";
import { users } from "./users";

/** CRM-F4-01: âncora de privacidade - uma linha por organização (mesmo
 * padrão de financial_settings), fixando o proprietário por `ownerUserId`
 * específico, não só por papel. `profitability.read_personal`/
 * `manage_personal` já restringem por papel (só `owner` tem), mas um papel
 * pode em tese ser concedido a mais de um usuário; esta tabela é a segunda
 * trava (services/personal-workspace.ts::requirePersonalAccess exige as
 * duas: papel certo E ser exatamente este usuário). */
export const personalWorkspaces = pgTable("personal_workspaces", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const personalAccounts = pgTable("personal_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  accountType: varchar("account_type", { length: 60 }),
  institution: varchar("institution", { length: 120 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const personalCategories = pgTable(
  "personal_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 140 }).notNull(),
    kind: personalCategoryKindEnum("kind").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.organizationId, t.name, t.kind)],
);

export const personalCreditCards = pgTable("personal_credit_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  closingDay: integer("closing_day").notNull(),
  dueDay: integer("due_day").notNull(),
  limitAmount: numeric("limit_amount", { precision: 14, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** CRM-F4-04: uma linha por (cartão, mês de referência) só para registrar o
 * pagamento da fatura - o valor da fatura em si é sempre derivado somando
 * personal_transactions.creditCardId do mês (nunca duplicado aqui). */
export const personalCreditCardInvoices = pgTable(
  "personal_credit_card_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => personalCreditCards.id, { onDelete: "cascade" }),
    referenceMonth: date("reference_month", { mode: "date" }).notNull(),
    dueDate: date("due_date", { mode: "date" }).notNull(),
    status: payableStatusEnum("status").notNull().default("open"),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "date" }),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.cardId, t.referenceMonth)],
);

/** CRM-F4-03/F4-05: lançamento pessoal (receita/despesa/transferência).
 * Parcelamento (F4-05) = N linhas compartilhando installmentGroupId, sem
 * tabela própria. CRUD simples (editar/excluir direto) - diferente do
 * razão empresarial (Fase 3), não há exigência de "histórico confiável"
 * para bookkeeping pessoal informal. */
export const personalTransactions = pgTable(
  "personal_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => personalAccounts.id, { onDelete: "set null" }),
    categoryId: uuid("category_id").references(() => personalCategories.id, {
      onDelete: "set null",
    }),
    creditCardId: uuid("credit_card_id").references(() => personalCreditCards.id, {
      onDelete: "set null",
    }),
    kind: personalTransactionKindEnum("kind").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    occurredAt: date("occurred_at", { mode: "date" }).notNull(),
    description: varchar("description", { length: 220 }).notNull(),
    notes: text("notes"),
    transferGroupId: uuid("transfer_group_id"),
    installmentGroupId: uuid("installment_group_id"),
    installmentNumber: integer("installment_number"),
    installmentTotal: integer("installment_total"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("personal_transactions_org_date_idx").on(t.organizationId, t.occurredAt),
    index("personal_transactions_card_idx").on(t.creditCardId),
  ],
);

/** CRM-F4-05: geração manual da próxima ocorrência (mesmo padrão de
 * financial_recurrence_rules na Fase 3 - sem motor de automação/job
 * agendado, isso é Fase 5). */
export const personalRecurrences = pgTable("personal_recurrences", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  kind: personalTransactionKindEnum("kind").notNull(),
  frequency: taskRecurrenceFrequencyEnum("frequency").notNull(),
  accountId: uuid("account_id").references(() => personalAccounts.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => personalCategories.id, { onDelete: "set null" }),
  description: varchar("description", { length: 220 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }),
  nextRunDate: date("next_run_date", { mode: "date" }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastGeneratedAt: timestamp("last_generated_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const personalBudgets = pgTable(
  "personal_budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    month: date("month", { mode: "date" }).notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => personalCategories.id, { onDelete: "cascade" }),
    plannedAmount: numeric("planned_amount", { precision: 14, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.organizationId, t.month, t.categoryId)],
);

export const personalGoals = pgTable("personal_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  targetAmount: numeric("target_amount", { precision: 14, scale: 2 }).notNull(),
  targetDate: date("target_date", { mode: "date" }),
  currentAmount: numeric("current_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const personalDebts = pgTable("personal_debts", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 14, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 3 }),
  dueDate: date("due_date", { mode: "date" }),
  status: payableStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

/** CRM-F4-08: mesmo parser CSV/OFX genérico da Fase 3
 * (services/bank-import.ts), tabelas próprias para não misturar extrato
 * pessoal com o razão empresarial. */
export const personalBankImports = pgTable("personal_bank_imports", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").references(() => personalAccounts.id, { onDelete: "set null" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  format: varchar("format", { length: 10 }).notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  totalLines: integer("total_lines").notNull().default(0),
  matchedLines: integer("matched_lines").notNull().default(0),
});

export const personalBankImportLines = pgTable(
  "personal_bank_import_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    importId: uuid("import_id")
      .notNull()
      .references(() => personalBankImports.id, { onDelete: "cascade" }),
    lineDate: date("line_date", { mode: "date" }).notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    externalId: varchar("external_id", { length: 120 }),
    matchedTransactionId: uuid("matched_transaction_id").references(
      (): AnyPgColumn => personalTransactions.id,
      { onDelete: "set null" },
    ),
    status: varchar("status", { length: 20 }).notNull().default("unmatched"),
    matchedAt: timestamp("matched_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("personal_bank_import_lines_import_idx").on(t.importId)],
);
