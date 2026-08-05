import { describe, expect, it } from "vitest";
import { financialAccountSchema } from "./financial-accounts.schemas";

describe("financialAccountSchema", () => {
  it("aceita apenas o nome", () => {
    expect(financialAccountSchema.safeParse({ name: "Caixa PULSO" }).success).toBe(true);
  });

  it("aceita todos os campos", () => {
    const result = financialAccountSchema.safeParse({
      name: "Banco Inter",
      accountType: "checking",
      institution: "Banco Inter",
      pixKeyType: "email",
      pixKeyMasked: "co***@pulso.com",
      isDefault: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(financialAccountSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
