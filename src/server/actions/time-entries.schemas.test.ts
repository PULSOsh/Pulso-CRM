import { describe, expect, it } from "vitest";
import { logTimeSchema } from "./time-entries.schemas";

describe("logTimeSchema", () => {
  it("aceita apontamento válido", () => {
    const result = logTimeSchema.safeParse({ workDate: "2026-08-04", hours: 3.5 });
    expect(result.success).toBe(true);
  });

  it("rejeita horas zero ou negativas", () => {
    expect(logTimeSchema.safeParse({ workDate: "2026-08-04", hours: 0 }).success).toBe(false);
    expect(logTimeSchema.safeParse({ workDate: "2026-08-04", hours: -1 }).success).toBe(false);
  });

  it("rejeita mais de 24 horas num único apontamento", () => {
    expect(logTimeSchema.safeParse({ workDate: "2026-08-04", hours: 25 }).success).toBe(false);
  });

  it("rejeita data vazia", () => {
    expect(logTimeSchema.safeParse({ workDate: "", hours: 1 }).success).toBe(false);
  });
});
