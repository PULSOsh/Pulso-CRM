import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { taskRecurrenceFrequencyEnum } from "./enums";
import { organizations } from "./organizations";
import { tasks } from "./tasks";

export const taskRecurrences = pgTable("task_recurrences", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .notNull()
    .unique()
    .references(() => tasks.id, { onDelete: "cascade" }),
  frequency: taskRecurrenceFrequencyEnum("frequency").notNull(),
  interval: integer("interval").notNull().default(1),
  until: timestamp("until", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});
