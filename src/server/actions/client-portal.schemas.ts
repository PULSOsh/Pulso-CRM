import { z } from "zod";

export const closeProjectSchema = z.object({
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CloseProjectInput = z.infer<typeof closeProjectSchema>;

export const submitSatisfactionSchema = z.object({
  score: z.coerce.number().int().min(1, "Escolha uma nota.").max(5),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type SubmitSatisfactionInput = z.infer<typeof submitSatisfactionSchema>;
