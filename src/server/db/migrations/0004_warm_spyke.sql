CREATE TYPE "public"."expense_scope" AS ENUM('personal', 'business', 'project');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('planned', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."expense_type" AS ENUM('fixed', 'variable', 'investment', 'pro_labore', 'withdrawal', 'distribution', 'reimbursement', 'contribution', 'personal_paid_by_company');--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"scope" "expense_scope" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category_id" uuid,
	"project_id" uuid,
	"product_id" uuid,
	"scope" "expense_scope" NOT NULL,
	"type" "expense_type" NOT NULL,
	"description" varchar(220) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"competence_date" date NOT NULL,
	"status" "expense_status" DEFAULT 'planned' NOT NULL,
	"paid_at" timestamp with time zone,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_settings" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"monthly_personal_need" numeric(14, 2),
	"business_cash_balance" numeric(14, 2),
	"personal_cash_balance" numeric(14, 2),
	"monthly_capacity_hours" numeric(6, 1),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_settings" ADD CONSTRAINT "financial_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;