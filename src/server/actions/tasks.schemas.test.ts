import { describe, expect, it } from "vitest";
import { createTaskSchema } from "./tasks.schemas";

describe("createTaskSchema", () => {
  it("exige título", () => {
    expect(createTaskSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("aceita só o título (resto opcional)", () => {
    expect(createTaskSchema.safeParse({ title: "Ligar pro cliente" }).success).toBe(true);
  });

  it("rejeita prioridade inválida", () => {
    const result = createTaskSchema.safeParse({ title: "X", priority: "critica" });
    expect(result.success).toBe(false);
  });

  it("aceita prioridade e prazo válidos", () => {
    const result = createTaskSchema.safeParse({
      title: "X",
      priority: "urgent",
      dueAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejeita título maior que 220 caracteres (limite da coluna varchar)", () => {
    const result = createTaskSchema.safeParse({ title: "a".repeat(221) });
    expect(result.success).toBe(false);
  });

  it("rejeita opportunityId que não seja um uuid válido", () => {
    const result = createTaskSchema.safeParse({ title: "X", opportunityId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});
