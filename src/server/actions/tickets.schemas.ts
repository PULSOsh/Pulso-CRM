import { z } from "zod";

export const ticketPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const createTicketSchema = z.object({
  subject: z.string().trim().min(1, "Assunto é obrigatório.").max(220),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  companyId: z.string().uuid().optional().or(z.literal("")),
  contactId: z.string().uuid().optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  priority: ticketPrioritySchema.optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const createPortalTicketSchema = z.object({
  subject: z.string().trim().min(1, "Assunto é obrigatório.").max(220),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
});
export type CreatePortalTicketInput = z.infer<typeof createPortalTicketSchema>;

export const addTicketCommentSchema = z.object({
  body: z.string().trim().min(1, "Comentário não pode ser vazio.").max(5000),
  isInternal: z.boolean().optional(),
});
export type AddTicketCommentInput = z.infer<typeof addTicketCommentSchema>;

export const updateTicketStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "waiting_customer", "resolved", "closed"]),
});
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
