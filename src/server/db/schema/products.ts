import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 160 }),
    category: varchar("category", { length: 120 }),
    description: text("description"),
    basePrice: numeric("base_price", { precision: 14, scale: 2 }).notNull().default("0"),
    pricingUnit: varchar("pricing_unit", { length: 40 }).notNull().default("project"),
    averageDeliveryDays: integer("average_delivery_days"),
    scopeDefault: text("scope_default"),
    termsDefault: text("terms_default"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.organizationId, t.slug)],
);
