import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { personalBudgetSchema } from "./personal-budgets.schemas";

describe("personalBudgetSchema", () => {
  it("aceita um orçamento válido", () => {
    const result = personalBudgetSchema.safeParse({
      month: "2026-09-01",
      categoryId: randomUUID(),
      plannedAmount: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita categoria ausente", () => {
    const result = personalBudgetSchema.safeParse({ month: "2026-09-01", plannedAmount: 500 });
    expect(result.success).toBe(false);
  });
});
