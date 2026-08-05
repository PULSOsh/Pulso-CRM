import { describe, expect, it } from "vitest";
import { personalAccountSchema } from "./personal-accounts.schemas";

describe("personalAccountSchema", () => {
  it("aceita apenas o nome", () => {
    expect(personalAccountSchema.safeParse({ name: "Conta corrente" }).success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(personalAccountSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
