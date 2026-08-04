ALTER TYPE "public"."briefing_submission_status" ADD VALUE 'needs_more_info' BEFORE 'qualified';--> statement-breakpoint
ALTER TABLE "briefing_submissions" ADD COLUMN "complement_requested_note" text;--> statement-breakpoint
ALTER TABLE "briefing_submissions" ADD COLUMN "complement_requested_at" timestamp with time zone;