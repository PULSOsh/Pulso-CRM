import { pgEnum } from "drizzle-orm/pg-core";

export const memberStatusEnum = pgEnum("member_status", [
  "invited",
  "active",
  "suspended",
  "removed",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "open",
  "won",
  "lost",
  "archived",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "note",
  "call",
  "whatsapp",
  "email",
  "meeting",
  "task",
  "stage_change",
  "proposal",
  "contract",
  "payment",
  "file",
  "system",
]);

export const taskStatusEnum = pgEnum("task_status", ["todo", "doing", "done", "cancelled"]);

export const taskPriorityEnum = pgEnum("task_priority", ["low", "normal", "high", "urgent"]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "sent",
  "viewed",
  "approved",
  "rejected",
  "expired",
  "cancelled",
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "sent",
  "signed",
  "cancelled",
  "ended",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planned",
  "active",
  "paused",
  "completed",
  "cancelled",
]);

export const installmentStatusEnum = pgEnum("installment_status", [
  "pending",
  "due_soon",
  "paid",
  "overdue",
  "cancelled",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "whatsapp",
  "webhook",
]);

export const briefingTemplateStatusEnum = pgEnum("briefing_template_status", [
  "draft",
  "published",
  "archived",
]);

export const briefingSubmissionStatusEnum = pgEnum("briefing_submission_status", [
  "started",
  "submitted",
  "under_review",
  "qualified",
  "linked",
  "proposal_created",
  "archived",
  "spam",
]);

export const proposalResponseTypeEnum = pgEnum("proposal_response_type", [
  "accepted",
  "rejected",
  "changes_requested",
]);

export const fieldOriginTypeEnum = pgEnum("field_origin_type", [
  "briefing",
  "crm",
  "manual",
  "product_catalog",
  "ai_suggestion",
  "system",
]);
