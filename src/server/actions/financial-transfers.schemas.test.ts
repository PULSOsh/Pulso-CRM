import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { financialTransferSchema } from "./financial-transfers.schemas";

describe("financialTransferSchema", () => {
  it("aceita contas diferentes e valor positivo", () => {
    const result = financialTransferSchema.safeParse({
      fromAccountId: randomUUID(),
      toAccountId: randomUUID(),
      amount: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita mesma conta de origem e destino", () => {
    const id = randomUUID();
    const result = financialTransferSchema.safeParse({
      fromAccountId: id,
      toAccountId: id,
      amount: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita valor zero", () => {
    const result = financialTransferSchema.safeParse({
      fromAccountId: randomUUID(),
      toAccountId: randomUUID(),
      amount: 0,
    });
    expect(result.success).toBe(false);
  });
});
