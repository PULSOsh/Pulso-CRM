import { describe, expect, it } from "vitest";
import { requestComplementSchema } from "./briefing-submissions.schemas";

describe("requestComplementSchema", () => {
  it("exige nota com pelo menos 3 caracteres", () => {
    expect(requestComplementSchema.safeParse({ note: "" }).success).toBe(false);
    expect(requestComplementSchema.safeParse({ note: "ok" }).success).toBe(false);
  });

  it("aceita nota válida", () => {
    expect(
      requestComplementSchema.safeParse({ note: "Falta o endereço completo da obra." }).success,
    ).toBe(true);
  });

  it("rejeita nota maior que 1000 caracteres", () => {
    expect(requestComplementSchema.safeParse({ note: "a".repeat(1001) }).success).toBe(false);
  });
});
