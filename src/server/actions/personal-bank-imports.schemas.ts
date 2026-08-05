import { z } from "zod";

export const personalBankImportSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  format: z.enum(["csv", "ofx"]),
  accountId: z.string().uuid().optional().or(z.literal("")),
  content: z.string().min(1, "Arquivo vazio."),
});

export type PersonalBankImportInput = z.infer<typeof personalBankImportSchema>;
