import { z } from "zod";

export const proposalBlockSchema = z.object({
  stableKey: z.enum(["not_included", "responsibilities"]),
  title: z.string().trim().max(240).optional(),
  body: z.string().trim().max(4000).optional().or(z.literal("")),
  isEnabled: z.boolean().default(true),
});

export type ProposalBlockInput = z.infer<typeof proposalBlockSchema>;

export const paymentPlanSchema = z.object({
  name: z.string().trim().max(180).default("Condição de pagamento"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  entryAmount: z.coerce.number().min(0).default(0),
  installmentCount: z.coerce.number().int().min(0).default(0),
  installmentAmount: z.coerce.number().min(0).default(0),
});

export type PaymentPlanInput = z.infer<typeof paymentPlanSchema>;
