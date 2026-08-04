import { describe, expect, it } from "vitest";
import { normalizeDigits, normalizeEmail } from "./dedup";

describe("normalizeEmail", () => {
  it("aparara e converte para minúsculas", () => {
    expect(normalizeEmail("  Ana@Exemplo.com  ")).toBe("ana@exemplo.com");
  });

  it("retorna null pra vazio/undefined/null", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("normalizeDigits", () => {
  it("remove tudo que não é dígito (telefone/CNPJ)", () => {
    expect(normalizeDigits("(85) 99999-0000")).toBe("85999990000");
    expect(normalizeDigits("12.345.678/0001-90")).toBe("12345678000190");
  });

  it("retorna null pra vazio/undefined/null/sem dígito nenhum", () => {
    expect(normalizeDigits("")).toBeNull();
    expect(normalizeDigits("abc")).toBeNull();
    expect(normalizeDigits(undefined)).toBeNull();
    expect(normalizeDigits(null)).toBeNull();
  });
});
