import { z } from "zod";

export const projectTemplateSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(160),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  checklistTitles: z
    .array(z.string().trim().min(1).max(220))
    .max(50, "Máximo de 50 itens de checklist por template."),
});

export type ProjectTemplateInput = z.infer<typeof projectTemplateSchema>;
