import { z } from "zod";

export const addNoteSchema = z.object({
  body: z.string().trim().min(1, "A nota não pode ficar vazia.").max(2000),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;
