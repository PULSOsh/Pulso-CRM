import { describe, expect, it } from "vitest";
import { knowledgeArticleSchema } from "./knowledge.schemas";

describe("knowledgeArticleSchema", () => {
  it("aceita título e conteúdo válidos", () => {
    const result = knowledgeArticleSchema.safeParse({
      title: "Como abrir um chamado",
      body: "Passo a passo...",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita conteúdo vazio", () => {
    expect(knowledgeArticleSchema.safeParse({ title: "X", body: "" }).success).toBe(false);
  });
});
