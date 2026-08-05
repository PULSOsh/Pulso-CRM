import { describe, expect, it } from "vitest";
import { calculateSlaDueAt } from "./sla";

describe("calculateSlaDueAt", () => {
  it("urgente vence em 4 horas", () => {
    const from = new Date("2026-09-01T10:00:00Z");
    expect(calculateSlaDueAt("urgent", from).toISOString()).toBe("2026-09-01T14:00:00.000Z");
  });

  it("baixa prioridade vence em 7 dias", () => {
    const from = new Date("2026-09-01T10:00:00Z");
    expect(calculateSlaDueAt("low", from).toISOString()).toBe("2026-09-08T10:00:00.000Z");
  });

  it("prioridades diferentes produzem prazos diferentes", () => {
    const from = new Date("2026-09-01T10:00:00Z");
    const urgent = calculateSlaDueAt("urgent", from).getTime();
    const high = calculateSlaDueAt("high", from).getTime();
    const normal = calculateSlaDueAt("normal", from).getTime();
    expect(urgent).toBeLessThan(high);
    expect(high).toBeLessThan(normal);
  });
});
