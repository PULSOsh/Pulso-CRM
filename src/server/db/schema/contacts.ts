import { boolean, date, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 120 }),
    email: text("email"),
    phone: varchar("phone", { length: 32 }),
    whatsapp: varchar("whatsapp", { length: 32 }),
    jobTitle: varchar("job_title", { length: 120 }),
    documentNumber: varchar("document_number", { length: 32 }),
    instagram: varchar("instagram", { length: 120 }),
    origin: varchar("origin", { length: 120 }),
    preferredChannel: varchar("preferred_channel", { length: 40 }),
    birthDate: date("birth_date", { mode: "date" }),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    index("contacts_org_name_idx").on(t.organizationId, t.firstName, t.lastName),
    index("contacts_org_email_idx").on(t.organizationId, t.email),
    index("contacts_org_phone_idx").on(t.organizationId, t.phone),
  ],
);
