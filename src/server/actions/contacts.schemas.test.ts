import { describe, expect, it } from "vitest";
import { updateContactSchema } from "./contacts.schemas";

describe("updateContactSchema", () => {
  it("exige nome", () => {
    expect(updateContactSchema.safeParse({ firstName: "" }).success).toBe(false);
  });

  it("aceita só o nome (resto opcional)", () => {
    expect(updateContactSchema.safeParse({ firstName: "Maria" }).success).toBe(true);
  });

  it("rejeita e-mail em formato inválido", () => {
    const result = updateContactSchema.safeParse({ firstName: "Maria", email: "não é email" });
    expect(result.success).toBe(false);
  });

  it("aceita e-mail vazio (campo opcional não preenchido)", () => {
    const result = updateContactSchema.safeParse({ firstName: "Maria", email: "" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome maior que 100 caracteres (limite da coluna varchar)", () => {
    const result = updateContactSchema.safeParse({ firstName: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});
