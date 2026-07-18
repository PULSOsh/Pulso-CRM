import { z } from "zod";

export const nextActionSchema = z
  .object({
    nextActionAt: z.iso.datetime().nullable(),
    nextActionDescription: z.string().trim().min(1).max(240).nullable(),
  })
  .refine((data) => (data.nextActionAt === null) === (data.nextActionDescription === null), {
    message: "Data e descrição da próxima ação devem ser preenchidas juntas ou ambas vazias.",
  });

export type NextActionInput = z.infer<typeof nextActionSchema>;

export const loseOpportunitySchema = z.object({
  lostReason: z.string().trim().min(1, "Motivo da perda é obrigatório.").max(180),
});

export type LoseOpportunityInput = z.infer<typeof loseOpportunitySchema>;
