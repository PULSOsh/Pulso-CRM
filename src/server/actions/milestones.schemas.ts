import { z } from "zod";

export const createMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório.").max(220),
  dueDate: z.string().trim().max(10).optional().or(z.literal("")),
  assignedTo: z.uuid().optional().or(z.literal("")),
  dependsOnMilestoneId: z.uuid().optional().or(z.literal("")),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
