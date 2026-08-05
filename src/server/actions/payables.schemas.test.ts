import { describe, expect, it } from "vitest";
import { markPayableInstallmentPaidSchema, payableSchema } from "./payables.schemas";

describe("payableSchema", () => {
  it("aceita descrição e um plano de parcelas válido", () => {
    const result = payableSchema.safeParse({
      description: "Aluguel do escritório",
      installmentsPlan: [{ amount: 1500, dueDate: "2026-09-05" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejeita sem parcelas", () => {
    const result = payableSchema.safeParse({
      description: "Sem parcela",
      installmentsPlan: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejeita valor de parcela zero ou negativo", () => {
    const result = payableSchema.safeParse({
      description: "Parcela inválida",
      installmentsPlan: [{ amount: 0, dueDate: "2026-09-05" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("markPayableInstallmentPaidSchema", () => {
  it("aceita valor de baixa parcial", () => {
    expect(markPayableInstallmentPaidSchema.safeParse({ paidAmount: 100 }).success).toBe(true);
  });

  it("rejeita valor zero", () => {
    expect(markPayableInstallmentPaidSchema.safeParse({ paidAmount: 0 }).success).toBe(false);
  });
});
