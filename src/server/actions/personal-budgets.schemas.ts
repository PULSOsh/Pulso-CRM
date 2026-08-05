import { z } from "zod";

export const personalBudgetSchema = z.object({
  month: z.string().min(1, "Mês é obrigatório."),
  categoryId: z.string().uuid("Categoria é obrigatória."),
  plannedAmount: z.number().positive("Valor deve ser maior que zero."),
});

export type PersonalBudgetInput = z.infer<typeof personalBudgetSchema>;
