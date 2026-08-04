import { describe, expect, it } from "vitest";
import { projectTemplateSchema } from "./project-templates.schemas";

describe("projectTemplateSchema", () => {
  it("aceita nome e checklist válidos", () => {
    const result = projectTemplateSchema.safeParse({
      name: "Site institucional",
      checklistTitles: ["Briefing", "Wireframe", "Publicação"],
    });
    expect(result.success).toBe(true);
  });

  it("aceita checklist vazia", () => {
    const result = projectTemplateSchema.safeParse({ name: "Template simples", checklistTitles: [] });
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(projectTemplateSchema.safeParse({ name: "", checklistTitles: [] }).success).toBe(false);
  });

  it("rejeita mais de 50 itens de checklist", () => {
    const result = projectTemplateSchema.safeParse({
      name: "X",
      checklistTitles: Array.from({ length: 51 }, (_, i) => `Item ${i}`),
    });
    expect(result.success).toBe(false);
  });
});
