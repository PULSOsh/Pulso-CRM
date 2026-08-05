import { addHours } from "date-fns";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

/** CRM-F5-01: SLA simples por prioridade, em horas corridas. */
const SLA_HOURS: Record<TicketPriority, number> = {
  urgent: 4,
  high: 24,
  normal: 72,
  low: 168,
};

/** Pure function - calculado uma vez na criação do ticket, nunca
 * recalculado se a prioridade mudar depois (o compromisso original fica
 * registrado em `slaDueAt`). */
export function calculateSlaDueAt(priority: TicketPriority, from: Date = new Date()): Date {
  return addHours(from, SLA_HOURS[priority]);
}
