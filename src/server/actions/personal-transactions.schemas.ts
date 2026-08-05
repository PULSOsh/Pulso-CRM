import { z } from "zod";

export const personalTransactionSchema = z.object({
  kind: z.enum(["income", "expense"]),
  accountId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  creditCardId: z.string().uuid().optional().or(z.literal("")),
  amount: z.number().positive("Valor deve ser maior que zero."),
  occurredAt: z.string().min(1, "Data é obrigatória."),
  description: z.string().trim().min(1, "Descrição é obrigatória.").max(220),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  installments: z.number().int().min(1).max(60).optional(),
});

export type PersonalTransactionInput = z.infer<typeof personalTransactionSchema>;

export const personalTransferSchema = z
  .object({
    fromAccountId: z.string().uuid("Conta de origem é obrigatória."),
    toAccountId: z.string().uuid("Conta de destino é obrigatória."),
    amount: z.number().positive("Valor deve ser maior que zero."),
    occurredAt: z.string().min(1, "Data é obrigatória."),
    description: z.string().trim().max(220).optional().or(z.literal("")),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "A conta de origem e destino devem ser diferentes.",
    path: ["toAccountId"],
  });

export type PersonalTransferInput = z.infer<typeof personalTransferSchema>;
