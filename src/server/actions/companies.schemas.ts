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

// Cabeçalho esperado do CSV de importação (CRM-F1-01):
// nomeFantasia,razaoSocial,cnpj,email,telefone,site.
export const importCompanyRowSchema = z.object({
  nomeFantasia: z.string().trim().min(1, "Nome fantasia é obrigatório."),
  razaoSocial: z.string().trim().optional().or(z.literal("")),
  cnpj: z.string().trim().optional().or(z.literal("")),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().trim().optional().or(z.literal("")),
  site: z.string().trim().optional().or(z.literal("")),
});

export type ImportCompanyRow = z.infer<typeof importCompanyRowSchema>;
