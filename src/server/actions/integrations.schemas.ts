import { z } from "zod";

export const integrationConnectionSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(140),
  url: z.string().trim().url("Informe uma URL válida."),
});

export type IntegrationConnectionInput = z.infer<typeof integrationConnectionSchema>;
