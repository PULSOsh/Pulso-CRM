import { z } from "zod";

export const personalCategorySchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(140),
  kind: z.enum(["income", "expense"]),
});

export type PersonalCategoryInput = z.infer<typeof personalCategorySchema>;
