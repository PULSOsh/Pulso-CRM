import { z } from "zod";

export const updateContactSchema = z.object({
  firstName: z.string().trim().min(1, "Nome é obrigatório.").max(100),
  lastName: z.string().trim().max(120).optional(),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional(),
  whatsapp: z.string().trim().max(32).optional(),
  jobTitle: z.string().trim().max(120).optional(),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;
