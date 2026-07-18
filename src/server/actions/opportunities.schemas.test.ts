import { describe, expect, it } from "vitest";
import { loseOpportunitySchema, nextActionSchema } from "./opportunities.schemas";

describe("nextActionSchema", () => {
  it("aceita data futura e descrição válidas", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: new Date(Date.now() + 86_400_000).toISOString(),
      nextActionDescription: "Ligar pra confirmar orçamento",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita descrição vazia quando a data é informada", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: new Date().toISOString(),
      nextActionDescription: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita descrição maior que 240 caracteres (limite da coluna varchar)", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: new Date().toISOString(),
      nextActionDescription: "a".repeat(241),
    });
    expect(result.success).toBe(false);
  });

  it("aceita limpar a próxima ação (ambos null)", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: null,
      nextActionDescription: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita data preenchida sem descrição", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: new Date().toISOString(),
      nextActionDescription: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita data em formato inválido", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: "não é uma data",
      nextActionDescription: "algo",
    });
    expect(result.success).toBe(false);
  });
});

describe("loseOpportunitySchema", () => {
  it("exige motivo de perda", () => {
    const result = loseOpportunitySchema.safeParse({ lostReason: "" });
    expect(result.success).toBe(false);
  });

  it("aceita motivo preenchido", () => {
    const result = loseOpportunitySchema.safeParse({
      lostReason: "Cliente escolheu concorrente",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita motivo maior que 180 caracteres (limite da coluna)", () => {
    const result = loseOpportunitySchema.safeParse({ lostReason: "a".repeat(181) });
    expect(result.success).toBe(false);
  });
});
