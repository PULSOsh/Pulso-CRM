import { z } from "zod";

export const personalRecurrenceSchema = z.object({
  kind: z.enum(["income", "expense"]),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  accountId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().trim().min(1, "Descrição é obrigatória.").max(220),
  amount: z.number().positive("Valor deve ser maior que zero."),
  startDate: z.string().min(1, "Data de início é obrigatória."),
  endDate: z.string().optional().or(z.literal("")),
});

export type PersonalRecurrenceInput = z.infer<typeof personalRecurrenceSchema>;
