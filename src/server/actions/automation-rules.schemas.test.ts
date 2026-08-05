import { describe, expect, it } from "vitest";
import { automationRuleSchema } from "./automation-rules.schemas";

describe("automationRuleSchema", () => {
  it("aceita uma regra simples com uma ação", () => {
    const result = automationRuleSchema.safeParse({
      name: "Notificar chamado urgente",
      triggerType: "ticket_created",
      actions: [{ type: "create_notification", params: { title: "Novo chamado" } }],
    });
    expect(result.success).toBe(true);
  });

  it("rejeita regra sem nenhuma ação", () => {
    const result = automationRuleSchema.safeParse({
      name: "Sem ação",
      triggerType: "ticket_created",
      actions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejeita gatilho desconhecido", () => {
    const result = automationRuleSchema.safeParse({
      name: "X",
      triggerType: "algo_qualquer",
      actions: [{ type: "create_notification", params: {} }],
    });
    expect(result.success).toBe(false);
  });
});
