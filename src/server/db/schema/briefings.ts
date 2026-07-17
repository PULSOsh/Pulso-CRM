import {
  boolean,
  index,
  integer,
  jsonb,
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
import {
  briefingSubmissionStatusEnum,
  briefingTemplateStatusEnum,
  fieldOriginTypeEnum,
} from "./enums";
import { opportunities } from "./opportunities";
import { organizations } from "./organizations";
import { pipelineStages, pipelines } from "./pipelines";
import { products } from "./products";
import { users } from "./users";

export const briefingTemplates = pgTable(
  "briefing_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    defaultPipelineId: uuid("default_pipeline_id").references(() => pipelines.id, {
      onDelete: "set null",
    }),
    defaultStageId: uuid("default_stage_id").references(() => pipelineStages.id, {
      onDelete: "set null",
    }),
    defaultOwnerUserId: uuid("default_owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    publicTitle: varchar("public_title", { length: 220 }).notNull(),
    publicDescription: text("public_description"),
    successTitle: varchar("success_title", { length: 220 }),
    successMessage: text("success_message"),
    status: briefingTemplateStatusEnum("status").notNull().default("draft"),
    createOpportunityOnSubmit: boolean("create_opportunity_on_submit").notNull().default(true),
    requireContactEmail: boolean("require_contact_email").notNull().default(true),
    allowResume: boolean("allow_resume").notNull().default(true),
    allowAttachments: boolean("allow_attachments").notNull().default(true),
    settings: jsonb("settings").notNull().default({}),
    publishedVersionId: uuid("published_version_id"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [unique().on(t.organizationId, t.slug)],
);

export const briefingTemplateVersions = pgTable(
  "briefing_template_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => briefingTemplates.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    snapshot: jsonb("snapshot").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    publishedBy: uuid("published_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.templateId, t.versionNumber)],
);

export const briefingSections = pgTable(
  "briefing_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateVersionId: uuid("template_version_id")
      .notNull()
      .references(() => briefingTemplateVersions.id, { onDelete: "cascade" }),
    stableKey: varchar("stable_key", { length: 120 }).notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    description: text("description"),
    position: integer("position").notNull(),
    settings: jsonb("settings").notNull().default({}),
  },
  (t) => [
    unique().on(t.templateVersionId, t.stableKey),
    unique("briefing_sections_version_position").on(t.templateVersionId, t.position),
  ],
);

export const briefingQuestions = pgTable(
  "briefing_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => briefingSections.id, { onDelete: "cascade" }),
    stableKey: varchar("stable_key", { length: 120 }).notNull(),
    questionType: varchar("question_type", { length: 40 }).notNull(),
    title: varchar("title", { length: 320 }).notNull(),
    helpText: text("help_text"),
    placeholder: varchar("placeholder", { length: 240 }),
    isRequired: boolean("is_required").notNull().default(false),
    isSensitive: boolean("is_sensitive").notNull().default(false),
    canUseInProposal: boolean("can_use_in_proposal").notNull().default(false),
    canDisplayPublicly: boolean("can_display_publicly").notNull().default(false),
    crmMappingKey: varchar("crm_mapping_key", { length: 120 }),
    validation: jsonb("validation").notNull().default({}),
    settings: jsonb("settings").notNull().default({}),
    position: integer("position").notNull(),
  },
  (t) => [
    unique().on(t.sectionId, t.stableKey),
    unique("briefing_questions_section_position").on(t.sectionId, t.position),
  ],
);

export const briefingQuestionOptions = pgTable(
  "briefing_question_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => briefingQuestions.id, { onDelete: "cascade" }),
    value: varchar("value", { length: 160 }).notNull(),
    label: varchar("label", { length: 220 }).notNull(),
    description: text("description"),
    position: integer("position").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
  },
  (t) => [
    unique().on(t.questionId, t.value),
    unique("briefing_options_question_position").on(t.questionId, t.position),
  ],
);

export const briefingLogicRules = pgTable("briefing_logic_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateVersionId: uuid("template_version_id")
    .notNull()
    .references(() => briefingTemplateVersions.id, { onDelete: "cascade" }),
  targetQuestionId: uuid("target_question_id").references(() => briefingQuestions.id, {
    onDelete: "cascade",
  }),
  targetSectionId: uuid("target_section_id").references(() => briefingSections.id, {
    onDelete: "cascade",
  }),
  action: varchar("action", { length: 30 }).notNull().default("show"),
  conditions: jsonb("conditions").notNull(),
  position: integer("position").notNull().default(0),
});

export const briefingSubmissions = pgTable(
  "briefing_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => briefingTemplates.id, { onDelete: "restrict" }),
    templateVersionId: uuid("template_version_id")
      .notNull()
      .references(() => briefingTemplateVersions.id, { onDelete: "restrict" }),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "set null",
    }),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    protocol: varchar("protocol", { length: 40 }).notNull(),
    status: briefingSubmissionStatusEnum("status").notNull().default("started"),
    source: varchar("source", { length: 80 }).notNull().default("public_site"),
    contactName: varchar("contact_name", { length: 180 }),
    contactEmail: text("contact_email"),
    contactPhone: varchar("contact_phone", { length: 32 }),
    companyName: varchar("company_name", { length: 220 }),
    completionPercent: smallint("completion_percent").notNull().default(0),
    templateSnapshot: jsonb("template_snapshot").notNull().default({}),
    metadata: jsonb("metadata").notNull().default({}),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }),
    qualifiedAt: timestamp("qualified_at", { withTimezone: true, mode: "date" }),
    linkedAt: timestamp("linked_at", { withTimezone: true, mode: "date" }),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.organizationId, t.protocol),
    index("briefing_submissions_inbox_idx").on(
      t.organizationId,
      t.status,
      t.submittedAt,
      t.createdAt,
    ),
    index("briefing_submissions_email_idx").on(t.organizationId, t.contactEmail),
  ],
);

export const briefingSubmissionAnswers = pgTable(
  "briefing_submission_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => briefingSubmissions.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => briefingQuestions.id, { onDelete: "restrict" }),
    questionKey: varchar("question_key", { length: 120 }).notNull(),
    value: jsonb("value").notNull(),
    normalizedText: text("normalized_text"),
    isVisibleByLogic: boolean("is_visible_by_logic").notNull().default(true),
    source: fieldOriginTypeEnum("source").notNull().default("briefing"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.submissionId, t.questionId),
    index("briefing_answers_submission_idx").on(t.submissionId),
  ],
);

export const briefingResumeTokens = pgTable("briefing_resume_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => briefingSubmissions.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  sentTo: text("sent_to"),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
