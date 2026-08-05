import { describe, expect, it } from "vitest";
import { vendorSchema } from "./vendors.schemas";

describe("vendorSchema", () => {
  it("aceita apenas o nome", () => {
    expect(vendorSchema.safeParse({ tradeName: "Fornecedor XYZ" }).success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    expect(vendorSchema.safeParse({ tradeName: "X", email: "não-é-email" }).success).toBe(false);
  });

  it("rejeita nome vazio", () => {
    expect(vendorSchema.safeParse({ tradeName: "" }).success).toBe(false);
  });
});
