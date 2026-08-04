import { z } from "zod";

export const logTimeSchema = z.object({
  workDate: z.string().trim().min(1, "Data é obrigatória."),
  hours: z.coerce.number().positive("Horas devem ser maiores que zero.").max(24),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export type LogTimeInput = z.infer<typeof logTimeSchema>;
