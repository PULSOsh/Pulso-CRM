import { z } from "zod";

export const automationConditionSchema = z.object({
  field: z.string().trim().min(1),
  operator: z.enum(["eq", "neq", "gt", "lt", "contains"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const automationActionSchema = z.object({
  type: z.enum(["create_notification", "create_task", "send_webhook"]),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const automationRuleSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(160),
  triggerType: z.enum([
    "opportunity_won",
    "opportunity_lost",
    "ticket_created",
    "ticket_sla_breached",
    "manual",
  ]),
  conditions: z.array(automationConditionSchema).max(10).default([]),
  actions: z.array(automationActionSchema).min(1, "Informe ao menos uma ação.").max(5),
});

export type AutomationRuleInput = z.infer<typeof automationRuleSchema>;
