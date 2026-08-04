import { z } from "zod";

export const updateContactSchema = z.object({
  firstName: z.string().trim().min(1, "Nome é obrigatório.").max(100),
  lastName: z.string().trim().max(120).optional(),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional(),
  whatsapp: z.string().trim().max(32).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  companyId: z.uuid().optional().or(z.literal("")),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;

// Cabeçalho esperado do CSV de importação (CRM-F1-01): nome,sobrenome,email,
// telefone,whatsapp,cargo,empresa. "empresa" só vincula a uma empresa já
// cadastrada (match exato de nome fantasia, sem diferenciar maiúsculas) -
// não cria empresa nova a partir do import de contato.
export const importContactRowSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório."),
  sobrenome: z.string().trim().optional().or(z.literal("")),
  email: z.email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().trim().optional().or(z.literal("")),
  whatsapp: z.string().trim().optional().or(z.literal("")),
  cargo: z.string().trim().optional().or(z.literal("")),
  empresa: z.string().trim().optional().or(z.literal("")),
});

export type ImportContactRow = z.infer<typeof importContactRowSchema>;
