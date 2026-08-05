import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { personalTransactionSchema, personalTransferSchema } from "./personal-transactions.schemas";

describe("personalTransactionSchema", () => {
  it("aceita um lançamento simples", () => {
    const result = personalTransactionSchema.safeParse({
      kind: "expense",
      amount: 150,
      occurredAt: "2026-09-05",
      description: "Mercado",
    });
    expect(result.success).toBe(true);
  });

  it("aceita parcelamento até 60x", () => {
    const result = personalTransactionSchema.safeParse({
      kind: "expense",
      amount: 1200,
      occurredAt: "2026-09-05",
      description: "Notebook",
      installments: 12,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita mais de 60 parcelas", () => {
    const result = personalTransactionSchema.safeParse({
      kind: "expense",
      amount: 1200,
      occurredAt: "2026-09-05",
      description: "X",
      installments: 61,
    });
    expect(result.success).toBe(false);
  });
});

describe("personalTransferSchema", () => {
  it("rejeita mesma conta de origem e destino", () => {
    const id = randomUUID();
    const result = personalTransferSchema.safeParse({
      fromAccountId: id,
      toAccountId: id,
      amount: 100,
      occurredAt: "2026-09-05",
    });
    expect(result.success).toBe(false);
  });
});
