import { z } from "zod";

export const vendorSchema = z.object({
  tradeName: z.string().trim().min(1, "Nome é obrigatório.").max(180),
  documentNumber: z.string().trim().max(32).optional().or(z.literal("")),
  email: z.string().trim().email("E-mail inválido.").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
});

export type VendorInput = z.infer<typeof vendorSchema>;
