CREATE TABLE "pipeline_loss_reasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"label" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pipeline_loss_reasons_organization_id_label_unique" UNIQUE("organization_id","label")
);
--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "lost_reason_id" uuid;--> statement-breakpoint
ALTER TABLE "pipeline_loss_reasons" ADD CONSTRAINT "pipeline_loss_reasons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lost_reason_id_pipeline_loss_reasons_id_fk" FOREIGN KEY ("lost_reason_id") REFERENCES "public"."pipeline_loss_reasons"("id") ON DELETE set null ON UPDATE no action;