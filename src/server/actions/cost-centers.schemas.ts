import { z } from "zod";

export const costCenterSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(140),
});

export type CostCenterInput = z.infer<typeof costCenterSchema>;
