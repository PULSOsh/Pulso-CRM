import { z } from "zod";

export const updateCompanySchema = z.object({
  tradeName: z.string().trim().min(1, "Nome fantasia é obrigatório.").max(180),
  legalName: z.string().trim().max(220).optional(),
  documentNumber: z.string().trim().max(32).optional(),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional(),
  website: z.string().trim().max(255).optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
