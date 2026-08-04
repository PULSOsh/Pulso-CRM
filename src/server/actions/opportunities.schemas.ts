import { z } from "zod";

export const nextActionSchema = z
  .object({
    nextActionAt: z.iso.datetime().nullable(),
    nextActionDescription: z.string().trim().min(1).max(240).nullable(),
  })
  .refine((data) => (data.nextActionAt === null) === (data.nextActionDescription === null), {
    message: "Data e descrição da próxima ação devem ser preenchidas juntas ou ambas vazias.",
  });

export type NextActionInput = z.infer<typeof nextActionSchema>;

export const loseOpportunitySchema = z.object({
  lostReason: z.string().trim().min(1, "Motivo da perda é obrigatório.").max(180),
  // Opcional (CRM-F1-02): quando o motivo digitado vem de um item selecionado
  // na lista configurável de motivos, referencia o registro pra permitir
  // agregação em relatórios. Sem ele, lostReason continua sendo salvo como
  // texto livre (compatibilidade com o comportamento anterior).
  lostReasonId: z.uuid().optional(),
});

export type LoseOpportunityInput = z.infer<typeof loseOpportunitySchema>;
