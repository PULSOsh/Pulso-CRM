import { describe, expect, it } from "vitest";
import { createMilestoneSchema } from "./milestones.schemas";

describe("createMilestoneSchema", () => {
  it("aceita só o título", () => {
    expect(createMilestoneSchema.safeParse({ title: "Entrega do wireframe" }).success).toBe(true);
  });

  it("rejeita título vazio", () => {
    expect(createMilestoneSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejeita assignedTo que não seja uuid", () => {
    expect(
      createMilestoneSchema.safeParse({ title: "X", assignedTo: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("aceita dependsOnMilestoneId válido", () => {
    const result = createMilestoneSchema.safeParse({
      title: "X",
      dependsOnMilestoneId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });
});
