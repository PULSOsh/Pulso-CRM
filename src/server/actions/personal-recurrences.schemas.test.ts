import { describe, expect, it } from "vitest";
import { personalRecurrenceSchema } from "./personal-recurrences.schemas";

describe("personalRecurrenceSchema", () => {
  it("aceita uma regra mensal de despesa", () => {
    const result = personalRecurrenceSchema.safeParse({
      kind: "expense",
      frequency: "monthly",
      description: "Aluguel",
      amount: 1800,
      startDate: "2026-09-05",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita valor não positivo", () => {
    const result = personalRecurrenceSchema.safeParse({
      kind: "expense",
      frequency: "monthly",
      description: "X",
      amount: 0,
      startDate: "2026-09-05",
    });
    expect(result.success).toBe(false);
  });
});
