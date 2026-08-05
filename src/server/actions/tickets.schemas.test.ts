import { describe, expect, it } from "vitest";
import { addTicketCommentSchema, createTicketSchema } from "./tickets.schemas";

describe("createTicketSchema", () => {
  it("aceita só o assunto", () => {
    expect(createTicketSchema.safeParse({ subject: "Site fora do ar" }).success).toBe(true);
  });

  it("rejeita assunto vazio", () => {
    expect(createTicketSchema.safeParse({ subject: "" }).success).toBe(false);
  });

  it("rejeita prioridade inválida", () => {
    const result = createTicketSchema.safeParse({ subject: "X", priority: "critica" });
    expect(result.success).toBe(false);
  });
});

describe("addTicketCommentSchema", () => {
  it("rejeita comentário vazio", () => {
    expect(addTicketCommentSchema.safeParse({ body: "" }).success).toBe(false);
  });
});
