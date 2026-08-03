import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório.").max(220),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dueAt: z.iso.datetime().optional(),
  assignedTo: z.uuid().optional(),
  opportunityId: z.uuid().optional(),
  companyId: z.uuid().optional(),
  contactId: z.uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const reopenTaskSchema = z.object({
  reason: z.string().trim().min(3, "Motivo é obrigatório.").max(500),
});

export type ReopenTaskInput = z.infer<typeof reopenTaskSchema>;

export const taskRecurrenceSchema = z
  .object({
    frequency: z.enum(["daily", "weekly", "monthly"]),
    interval: z.coerce.number().int().min(1).max(365),
    until: z.iso.datetime().optional().or(z.literal("")),
  })
  .refine((data) => !data.until || new Date(data.until).getTime() > Date.now(), {
    message: "Data-limite deve estar no futuro.",
    path: ["until"],
  });

export type TaskRecurrenceInput = z.infer<typeof taskRecurrenceSchema>;
