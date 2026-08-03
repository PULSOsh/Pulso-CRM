import { z } from "zod";

export const createPipelineSchema = z.object({
  name: z.string().trim().min(1, "Nome do funil é obrigatório.").max(120),
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;

export const updateOpportunitySchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório.").max(220),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  source: z.string().trim().max(120).optional().or(z.literal("")),
  estimatedValue: z.coerce.number().min(0).optional(),
  negotiatedValue: z.coerce.number().min(0).optional(),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().trim().max(10).optional().or(z.literal("")),
});

export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;

export const opportunityProductSchema = z.object({
  productId: z.uuid(),
  quantity: z.coerce.number().positive().default(1),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type OpportunityProductInput = z.infer<typeof opportunityProductSchema>;
