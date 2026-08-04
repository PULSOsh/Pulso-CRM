import { describe, expect, it } from "vitest";
import { closeProjectSchema, submitSatisfactionSchema } from "./client-portal.schemas";

describe("closeProjectSchema", () => {
  it("aceita sem nota", () => {
    expect(closeProjectSchema.safeParse({}).success).toBe(true);
  });

  it("rejeita nota maior que 2000 caracteres", () => {
    expect(closeProjectSchema.safeParse({ notes: "a".repeat(2001) }).success).toBe(false);
  });
});

describe("submitSatisfactionSchema", () => {
  it("aceita nota de 1 a 5", () => {
    for (const score of [1, 2, 3, 4, 5]) {
      expect(submitSatisfactionSchema.safeParse({ score }).success).toBe(true);
    }
  });

  it("rejeita nota fora do intervalo 1-5", () => {
    expect(submitSatisfactionSchema.safeParse({ score: 0 }).success).toBe(false);
    expect(submitSatisfactionSchema.safeParse({ score: 6 }).success).toBe(false);
  });
});
