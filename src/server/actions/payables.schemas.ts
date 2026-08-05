import { z } from "zod";

export const payableInstallmentInputSchema = z.object({
  amount: z.number().positive("Valor deve ser maior que zero."),
  dueDate: z.string().min(1, "Vencimento é obrigatório."),
});

export const payableSchema = z.object({
  description: z.string().trim().min(1, "Descrição é obrigatória.").max(220),
  vendorCompanyId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  costCenterId: z.string().uuid().optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  installmentsPlan: z
    .array(payableInstallmentInputSchema)
    .min(1, "Informe ao menos uma parcela.")
    .max(60),
});

export type PayableInput = z.infer<typeof payableSchema>;

export const markPayableInstallmentPaidSchema = z.object({
  paidAmount: z.number().positive("Valor deve ser maior que zero."),
  paymentMethod: z.string().trim().max(80).optional().or(z.literal("")),
  accountId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type MarkPayableInstallmentPaidInput = z.infer<typeof markPayableInstallmentPaidSchema>;
