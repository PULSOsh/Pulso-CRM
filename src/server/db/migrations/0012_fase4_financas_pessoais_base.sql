CREATE TYPE "public"."personal_category_kind" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."personal_transaction_kind" AS ENUM('income', 'expense', 'transfer_in', 'transfer_out');--> statement-breakpoint
CREATE TABLE "personal_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"account_type" varchar(60),
	"institution" varchar(120),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_bank_import_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid NOT NULL,
	"line_date" date NOT NULL,
	"description" varchar(255) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"external_id" varchar(120),
	"matched_transaction_id" uuid,
	"status" varchar(20) DEFAULT 'unmatched' NOT NULL,
	"matched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_bank_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"account_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"format" varchar(10) NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"total_lines" integer DEFAULT 0 NOT NULL,
	"matched_lines" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"month" date NOT NULL,
	"category_id" uuid NOT NULL,
	"planned_amount" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_budgets_organization_id_month_category_id_unique" UNIQUE("organization_id","month","category_id")
);
--> statement-breakpoint
CREATE TABLE "personal_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"kind" "personal_category_kind" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_categories_organization_id_name_kind_unique" UNIQUE("organization_id","name","kind")
);
--> statement-breakpoint
CREATE TABLE "personal_credit_card_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"reference_month" date NOT NULL,
	"due_date" date NOT NULL,
	"status" "payable_status" DEFAULT 'open' NOT NULL,
	"paid_at" timestamp with time zone,
	"paid_amount" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_credit_card_invoices_card_id_reference_month_unique" UNIQUE("card_id","reference_month")
);
--> statement-breakpoint
CREATE TABLE "personal_credit_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"closing_day" integer NOT NULL,
	"due_day" integer NOT NULL,
	"limit_amount" numeric(14, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"remaining_amount" numeric(14, 2) NOT NULL,
	"interest_rate" numeric(6, 3),
	"due_date" date,
	"status" "payable_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"target_amount" numeric(14, 2) NOT NULL,
	"target_date" date,
	"current_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_recurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kind" "personal_transaction_kind" NOT NULL,
	"frequency" "task_recurrence_frequency" NOT NULL,
	"account_id" uuid,
	"category_id" uuid,
	"description" varchar(220) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"next_run_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"account_id" uuid,
	"category_id" uuid,
	"credit_card_id" uuid,
	"kind" "personal_transaction_kind" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"occurred_at" date NOT NULL,
	"description" varchar(220) NOT NULL,
	"notes" text,
	"transfer_group_id" uuid,
	"installment_group_id" uuid,
	"installment_number" integer,
	"installment_total" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_workspaces" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "personal_accounts" ADD CONSTRAINT "personal_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_bank_import_lines" ADD CONSTRAINT "personal_bank_import_lines_import_id_personal_bank_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."personal_bank_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_bank_import_lines" ADD CONSTRAINT "personal_bank_import_lines_matched_transaction_id_personal_transactions_id_fk" FOREIGN KEY ("matched_transaction_id") REFERENCES "public"."personal_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_bank_imports" ADD CONSTRAINT "personal_bank_imports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_bank_imports" ADD CONSTRAINT "personal_bank_imports_account_id_personal_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."personal_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_budgets" ADD CONSTRAINT "personal_budgets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_budgets" ADD CONSTRAINT "personal_budgets_category_id_personal_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."personal_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_categories" ADD CONSTRAINT "personal_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_credit_card_invoices" ADD CONSTRAINT "personal_credit_card_invoices_card_id_personal_credit_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."personal_credit_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_credit_cards" ADD CONSTRAINT "personal_credit_cards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_debts" ADD CONSTRAINT "personal_debts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_goals" ADD CONSTRAINT "personal_goals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_recurrences" ADD CONSTRAINT "personal_recurrences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_recurrences" ADD CONSTRAINT "personal_recurrences_account_id_personal_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."personal_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_recurrences" ADD CONSTRAINT "personal_recurrences_category_id_personal_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."personal_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_account_id_personal_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."personal_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_category_id_personal_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."personal_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_transactions" ADD CONSTRAINT "personal_transactions_credit_card_id_personal_credit_cards_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."personal_credit_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_workspaces" ADD CONSTRAINT "personal_workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_workspaces" ADD CONSTRAINT "personal_workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "personal_bank_import_lines_import_idx" ON "personal_bank_import_lines" USING btree ("import_id");--> statement-breakpoint
CREATE INDEX "personal_transactions_org_date_idx" ON "personal_transactions" USING btree ("organization_id","occurred_at");--> statement-breakpoint
CREATE INDEX "personal_transactions_card_idx" ON "personal_transactions" USING btree ("credit_card_id");