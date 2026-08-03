import { describe, expect, it } from "vitest";
import { calculateNextDueDate } from "./recurrence";

describe("calculateNextDueDate", () => {
  it("soma dias para frequência diária", () => {
    const result = calculateNextDueDate(new Date("2026-08-03T10:00:00Z"), "daily", 1);
    expect(result.toISOString()).toBe("2026-08-04T10:00:00.000Z");
  });

  it("soma semanas para frequência semanal", () => {
    const result = calculateNextDueDate(new Date("2026-08-03T10:00:00Z"), "weekly", 1);
    expect(result.toISOString()).toBe("2026-08-10T10:00:00.000Z");
  });

  it("soma meses para frequência mensal", () => {
    const result = calculateNextDueDate(new Date("2026-08-03T10:00:00Z"), "monthly", 1);
    expect(result.toISOString()).toBe("2026-09-03T10:00:00.000Z");
  });

  it("respeita intervalo maior que 1", () => {
    const result = calculateNextDueDate(new Date("2026-08-03T10:00:00Z"), "weekly", 2);
    expect(result.toISOString()).toBe("2026-08-17T10:00:00.000Z");
  });

  it("mensal atravessa virada de ano corretamente", () => {
    const result = calculateNextDueDate(new Date("2026-12-15T10:00:00Z"), "monthly", 1);
    expect(result.toISOString()).toBe("2027-01-15T10:00:00.000Z");
  });
});
