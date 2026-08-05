import { db } from "../db/connection";
import { financialTransactions } from "../db/schema";
import type {
  financialTransactionDirectionEnum,
  financialTransactionKindEnum,
} from "../db/schema/enums";

type TransactionKind = (typeof financialTransactionKindEnum.enumValues)[number];
type TransactionDirection = (typeof financialTransactionDirectionEnum.enumValues)[number];
type DbClient = Pick<typeof db, "insert">;

/**
 * Plain internal helper, NOT a server action (mesmo motivo de logActivity/
 * writeAuditLog) - só é chamado de dentro de actions que já resolveram
 * organizationId/userId via requirePermission(). Uma linha por movimentação
 * real de caixa, nunca editada depois (CRM-F3-05/F3-06): um estorno é uma
 * nova linha com `direction` invertida, não um update desta.
 */
export async function postFinancialTransaction(
  params: {
    organizationId: string;
    accountId?: string | null;
    kind: TransactionKind;
    direction: TransactionDirection;
    amount: number;
    occurredAt?: Date;
    categoryId?: string | null;
    costCenterId?: string | null;
    sourceType?: string;
    sourceId?: string;
    transferGroupId?: string;
    description: string;
    notes?: string;
    createdBy: string | null;
  },
  dbClient: DbClient = db,
) {
  const [transaction] = await dbClient
    .insert(financialTransactions)
    .values({
      organizationId: params.organizationId,
      accountId: params.accountId ?? null,
      kind: params.kind,
      direction: params.direction,
      amount: params.amount.toFixed(2),
      occurredAt: params.occurredAt ?? new Date(),
      categoryId: params.categoryId ?? null,
      costCenterId: params.costCenterId ?? null,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      transferGroupId: params.transferGroupId,
      description: params.description,
      notes: params.notes,
      createdBy: params.createdBy,
    })
    .returning();
  return transaction;
}
