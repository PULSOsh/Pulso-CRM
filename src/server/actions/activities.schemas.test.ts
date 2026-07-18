import { describe, expect, it } from "vitest";
import { addNoteSchema } from "./activities.schemas";

describe("addNoteSchema", () => {
  it("exige corpo da nota", () => {
    expect(addNoteSchema.safeParse({ body: "" }).success).toBe(false);
  });

  it("aceita nota preenchida", () => {
    expect(addNoteSchema.safeParse({ body: "Cliente pediu desconto" }).success).toBe(true);
  });

  it("rejeita nota maior que 2000 caracteres", () => {
    expect(addNoteSchema.safeParse({ body: "a".repeat(2001) }).success).toBe(false);
  });
});
