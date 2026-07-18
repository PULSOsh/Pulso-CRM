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
