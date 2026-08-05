import { describe, expect, it } from "vitest";
import { personalCreditCardSchema } from "./personal-credit-cards.schemas";

describe("personalCreditCardSchema", () => {
  it("aceita dias de fechamento/vencimento válidos", () => {
    const result = personalCreditCardSchema.safeParse({
      name: "Nubank",
      closingDay: 10,
      dueDay: 17,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita dia fora do intervalo 1-31", () => {
    const result = personalCreditCardSchema.safeParse({
      name: "Nubank",
      closingDay: 32,
      dueDay: 17,
    });
    expect(result.success).toBe(false);
  });
});
