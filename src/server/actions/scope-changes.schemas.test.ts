import { describe, expect, it } from "vitest";
import { decideScopeChangeSchema, requestScopeChangeSchema } from "./scope-changes.schemas";

describe("requestScopeChangeSchema", () => {
  it("aceita título só (resto opcional, valueDelta default 0)", () => {
    const result = requestScopeChangeSchema.safeParse({ title: "Adicionar página extra" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.valueDelta).toBe(0);
  });

  it("rejeita título vazio", () => {
    expect(requestScopeChangeSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("aceita valueDelta negativo (redução de escopo)", () => {
    const result = requestScopeChangeSchema.safeParse({ title: "X", valueDelta: -500 });
    expect(result.success).toBe(true);
  });
});

describe("decideScopeChangeSchema", () => {
  it("aceita aprovação sem nota", () => {
    expect(decideScopeChangeSchema.safeParse({ approved: true }).success).toBe(true);
  });

  it("rejeita nota maior que 1000 caracteres", () => {
    expect(
      decideScopeChangeSchema.safeParse({ approved: false, notes: "a".repeat(1001) }).success,
    ).toBe(false);
  });
});
