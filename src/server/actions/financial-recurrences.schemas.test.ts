import { describe, expect, it } from "vitest";
import { financialRecurrenceSchema } from "./financial-recurrences.schemas";

describe("financialRecurrenceSchema", () => {
  it("aceita regra mensal de pagável", () => {
    const result = financialRecurrenceSchema.safeParse({
      targetType: "payable",
      frequency: "monthly",
      startDate: "2026-09-05",
      description: "Assinatura de software",
      amount: 199,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita targetType inválido", () => {
    const result = financialRecurrenceSchema.safeParse({
      targetType: "invoice",
      frequency: "monthly",
      startDate: "2026-09-05",
      description: "X",
      amount: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita valor não positivo", () => {
    const result = financialRecurrenceSchema.safeParse({
      targetType: "receivable",
      frequency: "monthly",
      startDate: "2026-09-05",
      description: "X",
      amount: -10,
    });
    expect(result.success).toBe(false);
  });
});
