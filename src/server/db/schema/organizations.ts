import { boolean, char, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  legalName: varchar("legal_name", { length: 200 }),
  documentType: varchar("document_type", { length: 20 }),
  documentNumber: varchar("document_number", { length: 32 }),
  email: text("email"),
  phone: varchar("phone", { length: 32 }),
  website: varchar("website", { length: 255 }),
  timezone: varchar("timezone", { length: 80 }).notNull().default("America/Fortaleza"),
  currency: char("currency", { length: 3 }).notNull().default("BRL"),
  locale: varchar("locale", { length: 16 }).notNull().default("pt-BR"),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 16 }).default("#E65318"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const organizationSettings = pgTable("organization_settings", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  settings: jsonb("settings").notNull().default({}),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
