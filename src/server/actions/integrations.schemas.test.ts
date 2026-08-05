import { describe, expect, it } from "vitest";
import { integrationConnectionSchema } from "./integrations.schemas";

describe("integrationConnectionSchema", () => {
  it("aceita nome e URL válidos", () => {
    const result = integrationConnectionSchema.safeParse({
      name: "Webhook Slack",
      url: "https://hooks.slack.com/services/x",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita URL inválida", () => {
    expect(integrationConnectionSchema.safeParse({ name: "X", url: "não-é-url" }).success).toBe(
      false,
    );
  });
});
