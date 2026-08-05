import { describe, expect, it } from "vitest";
import { personalBankImportSchema } from "./personal-bank-imports.schemas";

describe("personalBankImportSchema", () => {
  it("aceita conteúdo CSV", () => {
    const result = personalBankImportSchema.safeParse({
      fileName: "extrato.csv",
      format: "csv",
      content: "data,valor\n2026-09-05,100\n",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita conteúdo vazio", () => {
    const result = personalBankImportSchema.safeParse({
      fileName: "extrato.csv",
      format: "csv",
      content: "",
    });
    expect(result.success).toBe(false);
  });
});
