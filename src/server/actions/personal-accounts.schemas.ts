import { z } from "zod";

export const personalAccountSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(140),
  accountType: z.string().trim().max(60).optional().or(z.literal("")),
  institution: z.string().trim().max(120).optional().or(z.literal("")),
});

export type PersonalAccountInput = z.infer<typeof personalAccountSchema>;
