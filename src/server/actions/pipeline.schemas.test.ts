import { describe, expect, it } from "vitest";
import { createPipelineSchema, createStageSchema, updateStageSchema } from "./pipeline.schemas";

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

describe("createStageSchema", () => {
  it("aceita nome, cor e probabilidade válidos", () => {
    const result = createStageSchema.safeParse({
      name: "Diagnóstico",
      color: "#3b82f6",
      probability: 25,
    });
    expect(result.success).toBe(true);
  });

  it("aceita sem cor (opcional)", () => {
    const result = createStageSchema.safeParse({ name: "Diagnóstico" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.probability).toBe(0);
    }
  });

  it("rejeita nome vazio", () => {
    const result = createStageSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita cor fora do formato hexadecimal", () => {
    const result = createStageSchema.safeParse({ name: "Etapa", color: "blue" });
    expect(result.success).toBe(false);
  });

  it("rejeita probabilidade acima de 100", () => {
    const result = createStageSchema.safeParse({ name: "Etapa", probability: 150 });
    expect(result.success).toBe(false);
  });

  it("rejeita probabilidade negativa", () => {
    const result = createStageSchema.safeParse({ name: "Etapa", probability: -1 });
    expect(result.success).toBe(false);
  });
});

describe("updateStageSchema", () => {
  it("exige probabilidade explícita (sem default)", () => {
    const result = updateStageSchema.safeParse({ name: "Etapa", probability: 50 });
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const result = updateStageSchema.safeParse({ name: "", probability: 50 });
    expect(result.success).toBe(false);
  });
});
