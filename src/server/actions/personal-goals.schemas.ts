import { z } from "zod";

export const personalGoalSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(140),
  targetAmount: z.number().positive("Valor-alvo deve ser maior que zero."),
  targetDate: z.string().optional().or(z.literal("")),
});
export type PersonalGoalInput = z.infer<typeof personalGoalSchema>;

export const contributeToGoalSchema = z.object({
  amount: z.number().positive("Valor deve ser maior que zero."),
});
export type ContributeToGoalInput = z.infer<typeof contributeToGoalSchema>;

export const personalDebtSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(140),
  totalAmount: z.number().positive("Valor total deve ser maior que zero."),
  interestRate: z.number().min(0).max(100).optional(),
  dueDate: z.string().optional().or(z.literal("")),
});
export type PersonalDebtInput = z.infer<typeof personalDebtSchema>;

export const payDebtSchema = z.object({
  amount: z.number().positive("Valor deve ser maior que zero."),
});
export type PayDebtInput = z.infer<typeof payDebtSchema>;
