import { z } from "zod";

export const financialRecurrenceSchema = z.object({
  targetType: z.enum(["receivable", "payable"]),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  startDate: z.string().min(1, "Data de início é obrigatória."),
  endDate: z.string().optional().or(z.literal("")),
  description: z.string().trim().min(1, "Descrição é obrigatória.").max(220),
  amount: z.number().positive("Valor deve ser maior que zero."),
  vendorCompanyId: z.string().uuid().optional().or(z.literal("")),
  clientCompanyId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  costCenterId: z.string().uuid().optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
});

export type FinancialRecurrenceInput = z.infer<typeof financialRecurrenceSchema>;
