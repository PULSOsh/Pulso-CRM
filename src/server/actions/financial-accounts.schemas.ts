import { z } from "zod";

export const financialAccountSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(140),
  accountType: z.string().trim().max(60).optional().or(z.literal("")),
  institution: z.string().trim().max(120).optional().or(z.literal("")),
  pixKeyType: z.string().trim().max(30).optional().or(z.literal("")),
  pixKeyMasked: z.string().trim().max(120).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export type FinancialAccountInput = z.infer<typeof financialAccountSchema>;
