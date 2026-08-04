import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { fieldOriginTypeEnum, proposalResponseTypeEnum, proposalStatusEnum } from "./enums";
import { opportunities } from "./opportunities";
import { organizations } from "./organizations";
import { products } from "./products";
import { users } from "./users";

export const proposalTemplates = pgTable("proposal_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  content: jsonb("content").notNull().default({}),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "cascade",
    }),
    templateId: uuid("template_id").references(() => proposalTemplates.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    code: varchar("code", { length: 40 }).notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    status: proposalStatusEnum("status").notNull().default("draft"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    validUntil: date("valid_until", { mode: "date" }),
    publicToken: uuid("public_token").notNull().defaultRandom().unique(),
    publicAccessEnabled: boolean("public_access_enabled").notNull().default(false),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
    firstViewedAt: timestamp("first_viewed_at", { withTimezone: true, mode: "date" }),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true, mode: "date" }),
    sourceType: varchar("source_type", { length: 40 }).notNull().default("manual"),
    sourceId: uuid("source_id"),
    currentVersionId: uuid("current_version_id"),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    publicSlug: varchar("public_slug", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.organizationId, t.code)],
);

export const proposalVersions = pgTable(
  "proposal_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    scope: text("scope"),
    terms: text("terms"),
    notes: text("notes"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    snapshot: jsonb("snapshot").notNull().default({}),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.proposalId, t.versionNumber)],
);

export const proposalItems = pgTable("proposal_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalVersionId: uuid("proposal_version_id")
    .notNull()
    .references(() => proposalVersions.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  description: varchar("description", { length: 240 }).notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  position: integer("position").notNull().default(0),
  // CRM-F1-06: item opcional - o cliente decide incluir ou não na página
  // pública antes de aceitar. proposal_selected_addons (schema já existia,
  // nunca usado) registra o que foi oferecido/escolhido em cada aceite.
  isOptional: boolean("is_optional").notNull().default(false),
});

export const proposalEvents = pgTable("proposal_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 60 }).notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const proposalBlocks = pgTable(
  "proposal_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalVersionId: uuid("proposal_version_id")
      .notNull()
      .references(() => proposalVersions.id, { onDelete: "cascade" }),
    blockType: varchar("block_type", { length: 60 }).notNull(),
    stableKey: varchar("stable_key", { length: 120 }).notNull(),
    title: varchar("title", { length: 240 }),
    content: jsonb("content").notNull().default({}),
    isEnabled: boolean("is_enabled").notNull().default(true),
    position: integer("position").notNull(),
    source: fieldOriginTypeEnum("source").notNull().default("manual"),
    sourceReferenceId: uuid("source_reference_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.proposalVersionId, t.stableKey),
    unique("proposal_blocks_version_position").on(t.proposalVersionId, t.position),
  ],
);

export const proposalPaymentOptions = pgTable("proposal_payment_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalVersionId: uuid("proposal_version_id")
    .notNull()
    .references(() => proposalVersions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  entryAmount: numeric("entry_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  installmentCount: integer("installment_count").notNull().default(1),
  installmentAmount: numeric("installment_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  position: integer("position").notNull().default(0),
  metadata: jsonb("metadata").notNull().default({}),
});

export const proposalPublicLinks = pgTable(
  "proposal_public_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    proposalVersionId: uuid("proposal_version_id")
      .notNull()
      .references(() => proposalVersions.id, { onDelete: "restrict" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    publicTokenPrefix: varchar("public_token_prefix", { length: 20 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    firstViewedAt: timestamp("first_viewed_at", { withTimezone: true, mode: "date" }),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true, mode: "date" }),
    viewCount: integer("view_count").notNull().default(0),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("proposal_public_links_active_idx").on(t.proposalId, t.isActive, t.createdAt)],
);

export const proposalResponses = pgTable(
  "proposal_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    proposalVersionId: uuid("proposal_version_id")
      .notNull()
      .references(() => proposalVersions.id, { onDelete: "restrict" }),
    publicLinkId: uuid("public_link_id").references(() => proposalPublicLinks.id, {
      onDelete: "set null",
    }),
    responseType: proposalResponseTypeEnum("response_type").notNull(),
    signerName: varchar("signer_name", { length: 180 }),
    signerEmail: text("signer_email"),
    signerRole: varchar("signer_role", { length: 160 }),
    message: text("message"),
    paymentOptionId: uuid("payment_option_id").references(() => proposalPaymentOptions.id, {
      onDelete: "set null",
    }),
    snapshotHash: varchar("snapshot_hash", { length: 128 }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    idempotencyKey: varchar("idempotency_key", { length: 128 }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.proposalId, t.idempotencyKey)],
);

export const proposalSelectedAddons = pgTable(
  "proposal_selected_addons",
  {
    responseId: uuid("response_id")
      .notNull()
      .references(() => proposalResponses.id, { onDelete: "cascade" }),
    proposalItemId: uuid("proposal_item_id")
      .notNull()
      .references(() => proposalItems.id, { onDelete: "restrict" }),
    selected: boolean("selected").notNull().default(true),
    amountSnapshot: numeric("amount_snapshot", { precision: 14, scale: 2 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.responseId, t.proposalItemId] })],
);
