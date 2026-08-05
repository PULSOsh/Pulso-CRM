import { describe, expect, it } from "vitest";
import { evaluateConditions } from "./automation";

describe("evaluateConditions", () => {
  it("retorna true para lista vazia de condições", () => {
    expect(evaluateConditions([], { anything: 1 })).toBe(true);
  });

  it("avalia eq corretamente", () => {
    const conditions = [{ field: "status", operator: "eq" as const, value: "won" }];
    expect(evaluateConditions(conditions, { status: "won" })).toBe(true);
    expect(evaluateConditions(conditions, { status: "lost" })).toBe(false);
  });

  it("exige todas as condições (semântica E)", () => {
    const conditions = [
      { field: "status", operator: "eq" as const, value: "won" },
      { field: "value", operator: "gt" as const, value: 1000 },
    ];
    expect(evaluateConditions(conditions, { status: "won", value: 500 })).toBe(false);
    expect(evaluateConditions(conditions, { status: "won", value: 5000 })).toBe(true);
  });

  it("contains só compara strings", () => {
    const conditions = [{ field: "subject", operator: "contains" as const, value: "urgente" }];
    expect(evaluateConditions(conditions, { subject: "Chamado urgente" })).toBe(true);
    expect(evaluateConditions(conditions, { subject: 123 })).toBe(false);
  });
});
