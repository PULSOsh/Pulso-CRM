import { describe, expect, it } from "vitest";
import { personalCategorySchema } from "./personal-categories.schemas";

describe("personalCategorySchema", () => {
  it("aceita categoria de despesa", () => {
    expect(personalCategorySchema.safeParse({ name: "Mercado", kind: "expense" }).success).toBe(
      true,
    );
  });

  it("rejeita kind inválido", () => {
    expect(personalCategorySchema.safeParse({ name: "Mercado", kind: "outro" }).success).toBe(
      false,
    );
  });
});
