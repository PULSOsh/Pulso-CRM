export type AutomationCondition = {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "contains";
  value: string | number | boolean;
};

export type AutomationAction = {
  type: "create_notification" | "create_task" | "send_webhook";
  params: Record<string, string | number | boolean | undefined>;
};

/** Pure function - avalia condições simples {campo, operador, valor} contra
 * o payload do evento, semântica E (todas precisam bater). Nunca monta SQL
 * dinâmico a partir disso. */
export function evaluateConditions(
  conditions: AutomationCondition[],
  context: Record<string, unknown>,
): boolean {
  return conditions.every((condition) => {
    const actual = context[condition.field];
    switch (condition.operator) {
      case "eq":
        return actual === condition.value;
      case "neq":
        return actual !== condition.value;
      case "gt":
        return (
          typeof actual === "number" &&
          typeof condition.value === "number" &&
          actual > condition.value
        );
      case "lt":
        return (
          typeof actual === "number" &&
          typeof condition.value === "number" &&
          actual < condition.value
        );
      case "contains":
        return (
          typeof actual === "string" &&
          typeof condition.value === "string" &&
          actual.includes(condition.value)
        );
      default:
        return false;
    }
  });
}

/** CRM-F5-04/F5-05: chave de idempotência - a mesma regra nunca executa
 * duas vezes para o mesmo evento/agregado (constraint unique em
 * automation_runs). */
export function computeAutomationIdempotencyKey(aggregateId: string): string {
  return aggregateId;
}
