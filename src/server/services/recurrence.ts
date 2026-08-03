import { addDays, addMonths, addWeeks } from "date-fns";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

/**
 * Pure function, no DB access - called from completeTask() after a
 * recurring task is marked done, to compute the next occurrence's dueAt.
 */
export function calculateNextDueDate(
  from: Date,
  frequency: RecurrenceFrequency,
  interval: number,
): Date {
  switch (frequency) {
    case "daily":
      return addDays(from, interval);
    case "weekly":
      return addWeeks(from, interval);
    case "monthly":
      return addMonths(from, interval);
  }
}
