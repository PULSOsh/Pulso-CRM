import { describe, expect, it } from "vitest";
import { costCenterSchema } from "./cost-centers.schemas";

describe("costCenterSchema", () => {
  it("aceita nome válido", () => {
    expect(costCenterSchema.safeParse({ name: "Marketing" }).success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(costCenterSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
