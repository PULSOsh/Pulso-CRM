import {
  date,
  index,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { contacts } from "./contacts";
import { opportunityStatusEnum } from "./enums";
import { organizations } from "./organizations";
import { pipelineStages, pipelines } from "./pipelines";
import { products } from "./products";
import { users } from "./users";

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "restrict" }),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => pipelineStages.id, { onDelete: "restrict" }),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    primaryContactId: uuid("primary_contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    title: varchar("title", { length: 220 }).notNull(),
    description: text("description"),
    source: varchar("source", { length: 120 }),
    status: opportunityStatusEnum("status").notNull().default("open"),
    temperature: varchar("temperature", { length: 24 }).default("warm"),
    estimatedValue: numeric("estimated_value", { precision: 14, scale: 2 }).notNull().default("0"),
    negotiatedValue: numeric("negotiated_value", { precision: 14, scale: 2 }),
    probability: smallint("probability"),
    expectedCloseDate: date("expected_close_date", { mode: "date" }),
    nextActionAt: timestamp("next_action_at", { withTimezone: true, mode: "date" }),
    nextActionDescription: varchar("next_action_description", { length: 240 }),
    lostReason: varchar("lost_reason", { length: 180 }),
    wonAt: timestamp("won_at", { withTimezone: true, mode: "date" }),
    lostAt: timestamp("lost_at", { withTimezone: true, mode: "date" }),
    position: numeric("position", { precision: 18, scale: 8 }).notNull().default("1000"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    index("opportunities_org_pipeline_stage_idx").on(
      t.organizationId,
      t.pipelineId,
      t.stageId,
      t.position,
    ),
    index("opportunities_owner_next_action_idx").on(t.ownerUserId, t.nextActionAt),
    index("opportunities_org_status_idx").on(t.organizationId, t.status),
  ],
);

export const opportunityProducts = pgTable(
  "opportunity_products",
  {
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 14, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
  },
  (t) => [primaryKey({ columns: [t.opportunityId, t.productId] })],
);

export const opportunityStageHistory = pgTable("opportunity_stage_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  opportunityId: uuid("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  fromStageId: uuid("from_stage_id").references(() => pipelineStages.id, { onDelete: "set null" }),
  toStageId: uuid("to_stage_id")
    .notNull()
    .references(() => pipelineStages.id, { onDelete: "restrict" }),
  movedBy: uuid("moved_by").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
