import { describe, expect, it } from "vitest";
import { createPipelineSchema } from "./pipeline.schemas";

describe("createPipelineSchema", () => {
  it("aceita nome válido", () => {
    const result = createPipelineSchema.safeParse({ name: "Parcerias" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const result = createPipelineSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita nome só com espaços", () => {
    const result = createPipelineSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejeita nome maior que 120 caracteres (limite da coluna varchar)", () => {
    const result = createPipelineSchema.safeParse({ name: "a".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("aparara espaços nas bordas", () => {
    const result = createPipelineSchema.safeParse({ name: "  Parcerias  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Parcerias");
    }
  });
});
