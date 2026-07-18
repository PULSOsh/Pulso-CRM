import { describe, expect, it } from "vitest";
import { updateCompanySchema } from "./companies.schemas";

describe("updateCompanySchema", () => {
  it("exige nome fantasia", () => {
    expect(updateCompanySchema.safeParse({ tradeName: "" }).success).toBe(false);
  });

  it("aceita só o nome fantasia (resto opcional)", () => {
    expect(updateCompanySchema.safeParse({ tradeName: "Empresa X" }).success).toBe(true);
  });

  it("rejeita e-mail em formato inválido", () => {
    const result = updateCompanySchema.safeParse({ tradeName: "Empresa X", email: "invalido" });
    expect(result.success).toBe(false);
  });

  it("rejeita nome fantasia maior que 180 caracteres (limite da coluna varchar)", () => {
    const result = updateCompanySchema.safeParse({ tradeName: "a".repeat(181) });
    expect(result.success).toBe(false);
  });
});
