/**
 * Pure function reaproveitada por installments (recebível) e
 * payable_installments (CRM-F3-06: baixa parcial acumulativa) - decide o
 * status a partir do total já pago, sem tocar banco.
 */
export function deriveInstallmentStatus(
  totalAmount: number,
  paidAmount: number,
  dueDate: Date,
): "paid" | "partially_paid" | "pending" | "overdue" {
  if (paidAmount >= totalAmount - 0.005) return "paid";
  if (paidAmount > 0.005) return "partially_paid";
  return dueDate < new Date() ? "overdue" : "pending";
}
