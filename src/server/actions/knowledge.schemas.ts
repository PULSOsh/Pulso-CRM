import { z } from "zod";

export const knowledgeArticleSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório.").max(220),
  body: z.string().trim().min(1, "Conteúdo é obrigatório.").max(20000),
  category: z.string().trim().max(120).optional().or(z.literal("")),
});

export type KnowledgeArticleInput = z.infer<typeof knowledgeArticleSchema>;
