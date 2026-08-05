import { describe, expect, it } from "vitest";
import { bankImportSchema } from "./bank-imports.schemas";

describe("bankImportSchema", () => {
  it("aceita CSV com conteúdo", () => {
    const result = bankImportSchema.safeParse({
      fileName: "extrato.csv",
      format: "csv",
      content: "data,valor\n2026-09-05,100\n",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita conteúdo vazio", () => {
    const result = bankImportSchema.safeParse({
      fileName: "extrato.csv",
      format: "csv",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita formato inválido", () => {
    const result = bankImportSchema.safeParse({
      fileName: "extrato.pdf",
      format: "pdf",
      content: "x",
    });
    expect(result.success).toBe(false);
  });
});
