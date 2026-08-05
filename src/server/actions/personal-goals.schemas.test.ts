import { describe, expect, it } from "vitest";
import { personalDebtSchema, personalGoalSchema } from "./personal-goals.schemas";

describe("personalGoalSchema", () => {
  it("aceita meta válida", () => {
    expect(personalGoalSchema.safeParse({ name: "Reserva", targetAmount: 10000 }).success).toBe(
      true,
    );
  });

  it("rejeita valor-alvo zero", () => {
    expect(personalGoalSchema.safeParse({ name: "Reserva", targetAmount: 0 }).success).toBe(false);
  });
});

describe("personalDebtSchema", () => {
  it("aceita dívida válida", () => {
    expect(personalDebtSchema.safeParse({ name: "Financiamento", totalAmount: 5000 }).success).toBe(
      true,
    );
  });

  it("rejeita taxa de juros acima de 100", () => {
    const result = personalDebtSchema.safeParse({ name: "X", totalAmount: 100, interestRate: 150 });
    expect(result.success).toBe(false);
  });
});
