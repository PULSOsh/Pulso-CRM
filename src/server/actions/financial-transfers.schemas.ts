import { z } from "zod";

export const financialTransferSchema = z
  .object({
    fromAccountId: z.string().uuid("Conta de origem é obrigatória."),
    toAccountId: z.string().uuid("Conta de destino é obrigatória."),
    amount: z.number().positive("Valor deve ser maior que zero."),
    description: z.string().trim().max(220).optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "A conta de origem e destino devem ser diferentes.",
    path: ["toAccountId"],
  });

export type FinancialTransferInput = z.infer<typeof financialTransferSchema>;
