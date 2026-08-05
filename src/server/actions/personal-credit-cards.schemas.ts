import { z } from "zod";

export const personalCreditCardSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(140),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
  limitAmount: z.number().positive().optional(),
});

export type PersonalCreditCardInput = z.infer<typeof personalCreditCardSchema>;

export const payPersonalInvoiceSchema = z.object({
  paidAmount: z.number().positive("Valor deve ser maior que zero."),
});

export type PayPersonalInvoiceInput = z.infer<typeof payPersonalInvoiceSchema>;
