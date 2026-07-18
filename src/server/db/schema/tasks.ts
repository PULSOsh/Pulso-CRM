import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { contacts } from "./contacts";
import { taskPriorityEnum, taskStatusEnum } from "./enums";
import { opportunities } from "./opportunities";
import { organizations } from "./organizations";
import { projects } from "./projects";
import { users } from "./users";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "cascade",
    }),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: varchar("title", { length: 220 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("normal"),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    reminderAt: timestamp("reminder_at", { withTimezone: true, mode: "date" }),
    recurrenceRule: text("recurrence_rule"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("tasks_assignee_due_idx").on(t.assignedTo, t.status, t.dueAt)],
);
