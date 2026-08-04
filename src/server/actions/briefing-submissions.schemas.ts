import { z } from "zod";

export const requestComplementSchema = z.object({
  note: z.string().trim().min(3, "Descreva o que falta pedir ao lead.").max(1000),
});

export type RequestComplementInput = z.infer<typeof requestComplementSchema>;
