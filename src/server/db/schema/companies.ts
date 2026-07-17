import {
  boolean,
  char,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { organizations } from "./organizations";
import { users } from "./users";

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    tradeName: varchar("trade_name", { length: 180 }).notNull(),
    legalName: varchar("legal_name", { length: 220 }),
    documentNumber: varchar("document_number", { length: 32 }),
    segment: varchar("segment", { length: 120 }),
    email: text("email"),
    phone: varchar("phone", { length: 32 }),
    website: varchar("website", { length: 255 }),
    instagram: varchar("instagram", { length: 120 }),
    addressLine: varchar("address_line", { length: 240 }),
    addressNumber: varchar("address_number", { length: 40 }),
    district: varchar("district", { length: 120 }),
    city: varchar("city", { length: 120 }),
    state: char("state", { length: 2 }),
    postalCode: varchar("postal_code", { length: 16 }),
    country: char("country", { length: 2 }).notNull().default("BR"),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    index("companies_org_name_idx").on(t.organizationId, t.tradeName),
    index("companies_org_document_idx").on(t.organizationId, t.documentNumber),
  ],
);

export const companyContacts = pgTable(
  "company_contacts",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    relationship: varchar("relationship", { length: 120 }),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.contactId] })],
);
