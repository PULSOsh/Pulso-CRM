import { z } from "zod";

export const requestScopeChangeSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório.").max(220),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  valueDelta: z.coerce.number().default(0),
  deadlineDeltaDays: z.coerce.number().int().optional(),
});

export type RequestScopeChangeInput = z.infer<typeof requestScopeChangeSchema>;

export const decideScopeChangeSchema = z.object({
  approved: z.boolean(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type DecideScopeChangeInput = z.infer<typeof decideScopeChangeSchema>;
