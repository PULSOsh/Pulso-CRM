import { describe, expect, it } from "vitest";
import { createTaskSchema, reopenTaskSchema, taskRecurrenceSchema } from "./tasks.schemas";

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

describe("reopenTaskSchema", () => {
  it("exige motivo", () => {
    expect(reopenTaskSchema.safeParse({ reason: "" }).success).toBe(false);
  });

  it("rejeita motivo muito curto", () => {
    expect(reopenTaskSchema.safeParse({ reason: "ok" }).success).toBe(false);
  });

  it("aceita motivo válido", () => {
    expect(reopenTaskSchema.safeParse({ reason: "Cliente pediu para reabrir" }).success).toBe(true);
  });

  it("rejeita motivo maior que 500 caracteres", () => {
    expect(reopenTaskSchema.safeParse({ reason: "a".repeat(501) }).success).toBe(false);
  });
});

describe("taskRecurrenceSchema", () => {
  it("aceita frequência e intervalo válidos, sem data-limite", () => {
    const result = taskRecurrenceSchema.safeParse({ frequency: "weekly", interval: 1 });
    expect(result.success).toBe(true);
  });

  it("aceita data-limite no futuro", () => {
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const result = taskRecurrenceSchema.safeParse({
      frequency: "monthly",
      interval: 1,
      until: future,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita data-limite no passado", () => {
    const result = taskRecurrenceSchema.safeParse({
      frequency: "daily",
      interval: 1,
      until: "2020-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita frequência inválida", () => {
    const result = taskRecurrenceSchema.safeParse({ frequency: "yearly", interval: 1 });
    expect(result.success).toBe(false);
  });

  it("rejeita intervalo zero ou negativo", () => {
    expect(taskRecurrenceSchema.safeParse({ frequency: "daily", interval: 0 }).success).toBe(false);
    expect(taskRecurrenceSchema.safeParse({ frequency: "daily", interval: -1 }).success).toBe(
      false,
    );
  });
});
