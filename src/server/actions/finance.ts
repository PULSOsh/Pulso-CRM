"use server";

import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { contracts, installments, projects, receivables } from "../db/schema";
import { logger } from "../logger";
import { logActivity } from "../services/activity-log";
import { writeAuditLog } from "../services/audit-log";

export type InstallmentInput = { amount: number; dueDate: string };

// Núcleo reaproveitável (CRM-F1-10): usado tanto pela action autenticada
// createReceivableFromContract quanto pela assinatura pública do contrato
// (sem sessão/userId, actorUserId nullable). Retorna null em vez de lançar
// se já existir recebível, pra chamada automática não quebrar quando já foi
// gerado manualmente antes.
async function createReceivableForSignedContract(
  organizationId: string,
  contractId: string,
  actorUserId: string | null,
  data: { description: string; installmentsPlan: InstallmentInput[] },
) {
  const contract = await db.query.contracts.findFirst({
    where: and(eq(contracts.id, contractId), eq(contracts.organizationId, organizationId)),
  });
  if (!contract) throw new Error("Contrato não encontrado.");
  if (contract.status !== "signed") {
    throw new Error("Só é possível gerar recebível a partir de um contrato assinado.");
  }
  if (data.installmentsPlan.length === 0) {
    throw new Error("Informe ao menos uma parcela.");
  }

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.organizationId, organizationId), eq(projects.contractId, contractId)),
  });

  const existing = project
    ? await db.query.receivables.findFirst({
        where: and(
          eq(receivables.organizationId, organizationId),
          eq(receivables.projectId, project.id),
        ),
      })
    : contract.opportunityId
      ? await db.query.receivables.findFirst({
          where: and(
            eq(receivables.organizationId, organizationId),
            eq(receivables.opportunityId, contract.opportunityId),
          ),
        })
      : null;
  if (existing) return null;

  // Validação de soma e arredondamento (docs/ARCHITECTURE_AND_STANDARDS.md §7:
  // dinheiro sempre em numeric/string, nunca float) - soma em centavos inteiros.
  const totalCents = data.installmentsPlan.reduce(
    (acc, item) => acc + Math.round(item.amount * 100),
    0,
  );
  if (totalCents <= 0) throw new Error("O valor total das parcelas deve ser maior que zero.");

  const [receivable] = await db.transaction(async (tx) => {
    const [rec] = await tx
      .insert(receivables)
      .values({
        organizationId,
        projectId: project?.id,
        opportunityId: contract.opportunityId,
        description: data.description,
        totalAmount: (totalCents / 100).toFixed(2),
        status: "open",
      })
      .returning();

    await tx.insert(installments).values(
      data.installmentsPlan.map((item, index) => ({
        receivableId: rec.id,
        installmentNumber: index + 1,
        amount: item.amount.toFixed(2),
        dueDate: new Date(item.dueDate),
        status: "pending" as const,
      })),
    );

    if (contract.opportunityId) {
      await logActivity(
        {
          organizationId,
          actorUserId,
          type: "payment",
          title: `Recebível gerado: ${data.description} (${data.installmentsPlan.length}x)`,
          opportunityId: contract.opportunityId,
        },
        tx,
      );
    }

    return [rec];
  });

  return receivable;
}

/** Gera recebível + parcelas a partir de um contrato assinado.
 * docs/MODULE_SPECIFICATIONS.md §12; STEP_BY_STEP_IMPLEMENTATION.md Fase 4. */
export async function createReceivableFromContract(
  contractId: string,
  data: { description: string; installmentsPlan: InstallmentInput[] },
) {
  const { organizationId, userId } = await requirePermission("finance.create");
  const receivable = await createReceivableForSignedContract(
    organizationId,
    contractId,
    userId,
    data,
  );
  if (!receivable) throw new Error("Já existe um recebível gerado para este contrato.");

  revalidatePath("/crm/financeiro");
  revalidatePath(`/crm/contratos/${contractId}`);
  return receivable;
}

// Chamado pela assinatura pública do contrato (CRM-F1-10) - gera um recebível
// com parcela única padrão (valor total do contrato, vencimento em 30 dias),
// já que não há ninguém definindo um plano de parcelamento no momento da
// assinatura. A equipe pode ajustar depois (o registro já existe pra baixa/
// estorno; um parcelamento diferente exigiria estornar e recriar, mesmo
// caminho que já existe pra qualquer correção financeira). Nunca lança: uma
// falha aqui não deve impedir a confirmação de assinatura que o cliente já
// viu; fica registrada no log estruturado (F0-09) pra follow-up manual via
// o formulário "Gerar recebível" já existente.
export async function tryAutoGenerateReceivable(
  organizationId: string,
  contractId: string,
  totalAmount: string,
  contractTitle: string,
) {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const receivable = await createReceivableForSignedContract(organizationId, contractId, null, {
      description: `Recebível - ${contractTitle}`,
      installmentsPlan: [{ amount: Number(totalAmount), dueDate: dueDate.toISOString() }],
    });
    if (receivable) {
      revalidatePath("/crm/financeiro");
      revalidatePath(`/crm/contratos/${contractId}`);
    }
    return receivable;
  } catch (error) {
    logger.error("Falha ao gerar recebível automaticamente após assinatura de contrato", {
      organizationId,
      contractId,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getReceivableForContract(contractId: string) {
  const { organizationId } = await requirePermission("finance.read");

  const contract = await db.query.contracts.findFirst({
    where: and(eq(contracts.id, contractId), eq(contracts.organizationId, organizationId)),
  });
  if (!contract) return null;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.organizationId, organizationId), eq(projects.contractId, contractId)),
  });

  const receivable = project
    ? await db.query.receivables.findFirst({
        where: and(
          eq(receivables.organizationId, organizationId),
          eq(receivables.projectId, project.id),
        ),
      })
    : contract.opportunityId
      ? await db.query.receivables.findFirst({
          where: and(
            eq(receivables.organizationId, organizationId),
            eq(receivables.opportunityId, contract.opportunityId),
          ),
        })
      : null;

  if (!receivable) return null;

  const items = await db.query.installments.findMany({
    where: eq(installments.receivableId, receivable.id),
    orderBy: [asc(installments.installmentNumber)],
  });

  return { receivable, installments: items };
}

export async function getReceivables() {
  const { organizationId } = await requirePermission("finance.read");

  const allReceivables = await db.query.receivables.findMany({
    where: eq(receivables.organizationId, organizationId),
    orderBy: [desc(receivables.createdAt)],
  });

  const companyIds = allReceivables.map((r) => r.companyId).filter(Boolean) as string[];
  const contactIds = allReceivables.map((r) => r.contactId).filter(Boolean) as string[];
  const allCompanies =
    companyIds.length > 0
      ? await db.query.companies.findMany({ where: (c, { inArray }) => inArray(c.id, companyIds) })
      : [];
  const allContacts =
    contactIds.length > 0
      ? await db.query.contacts.findMany({ where: (c, { inArray }) => inArray(c.id, contactIds) })
      : [];

  const results = await Promise.all(
    allReceivables.map(async (r) => {
      const items = await db.query.installments.findMany({
        where: eq(installments.receivableId, r.id),
        orderBy: [asc(installments.installmentNumber)],
      });
      return {
        ...r,
        company: allCompanies.find((c) => c.id === r.companyId),
        contact: allContacts.find((c) => c.id === r.contactId),
        installments: items,
      };
    }),
  );

  return results;
}

/** Sem job agendado ainda (Fase 7) - verificação sob demanda, mesmo padrão
 * já usado por getOverdueAlerts/getOverdueTasks. */
export async function refreshOverdueInstallments() {
  const { organizationId } = await requirePermission("finance.read");

  const orgReceivableIds = db
    .select({ id: receivables.id })
    .from(receivables)
    .where(eq(receivables.organizationId, organizationId));

  await db
    .update(installments)
    .set({ status: "overdue", updatedAt: new Date() })
    .where(
      and(
        eq(installments.status, "pending"),
        lt(installments.dueDate, new Date()),
        inArray(installments.receivableId, orgReceivableIds),
      ),
    );
}

export async function markInstallmentPaid(
  installmentId: string,
  data: { paidAmount: number; paymentMethod?: string; notes?: string },
) {
  const { organizationId, userId } = await requirePermission("finance.mark_paid");

  const installment = await db.query.installments.findFirst({
    where: eq(installments.id, installmentId),
  });
  if (!installment) throw new Error("Parcela não encontrada.");

  const receivable = await db.query.receivables.findFirst({
    where: and(
      eq(receivables.id, installment.receivableId),
      eq(receivables.organizationId, organizationId),
    ),
  });
  if (!receivable) throw new Error("Parcela não encontrada.");
  if (installment.status === "paid") throw new Error("Parcela já baixada.");
  if (installment.status === "cancelled")
    throw new Error("Parcela cancelada não pode ser baixada.");

  await db.transaction(async (tx) => {
    await tx
      .update(installments)
      .set({
        status: "paid",
        paidAt: new Date(),
        paidAmount: data.paidAmount.toFixed(2),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(installments.id, installmentId));

    const remaining = await tx.query.installments.findMany({
      where: eq(installments.receivableId, receivable.id),
    });
    const allPaid = remaining.every((i) => i.id === installmentId || i.status === "paid");
    if (allPaid) {
      await tx
        .update(receivables)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(receivables.id, receivable.id));
    }

    if (receivable.opportunityId) {
      await logActivity(
        {
          organizationId,
          actorUserId: userId,
          type: "payment",
          title: `Parcela ${installment.installmentNumber} baixada: ${new Intl.NumberFormat(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            },
          ).format(data.paidAmount)}`,
          opportunityId: receivable.opportunityId,
        },
        tx,
      );
    }

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "installment.paid",
        entityType: "installment",
        entityId: installmentId,
        before: { status: installment.status },
        after: { status: "paid", paidAmount: data.paidAmount },
      },
      tx,
    );
  });

  revalidatePath("/crm/financeiro");
  return { success: true };
}

/** Estorno como evento inverso (docs/ARCHITECTURE_AND_STANDARDS.md §8):
 * volta a parcela para pendente/vencida e reabre o recebível, sem apagar
 * o histórico do que foi pago (o valor anterior fica só até aqui, sem
 * tabela de ledger dedicada nesta fase - registrado como débito). */
export async function reverseInstallmentPayment(installmentId: string, reason: string) {
  const { organizationId, userId } = await requirePermission("finance.reverse");

  const installment = await db.query.installments.findFirst({
    where: eq(installments.id, installmentId),
  });
  if (!installment) throw new Error("Parcela não encontrada.");
  if (installment.status !== "paid") throw new Error("Só é possível estornar uma parcela baixada.");

  const receivable = await db.query.receivables.findFirst({
    where: and(
      eq(receivables.id, installment.receivableId),
      eq(receivables.organizationId, organizationId),
    ),
  });
  if (!receivable) throw new Error("Parcela não encontrada.");

  const newStatus = installment.dueDate < new Date() ? "overdue" : "pending";

  await db.transaction(async (tx) => {
    await tx
      .update(installments)
      .set({
        status: newStatus,
        paidAt: null,
        paidAmount: null,
        notes: `${installment.notes ? `${installment.notes}\n` : ""}Estornado: ${reason}`,
        updatedAt: new Date(),
      })
      .where(eq(installments.id, installmentId));

    await tx
      .update(receivables)
      .set({ status: "open", updatedAt: new Date() })
      .where(eq(receivables.id, receivable.id));

    if (receivable.opportunityId) {
      await logActivity(
        {
          organizationId,
          actorUserId: userId,
          type: "payment",
          title: `Estorno da parcela ${installment.installmentNumber}: ${reason}`,
          opportunityId: receivable.opportunityId,
        },
        tx,
      );
    }

    await writeAuditLog(
      {
        organizationId,
        actorUserId: userId,
        action: "installment.reversed",
        entityType: "installment",
        entityId: installmentId,
        before: { status: "paid", paidAmount: installment.paidAmount },
        after: { status: newStatus, reason },
      },
      tx,
    );
  });

  revalidatePath("/crm/financeiro");
  return { success: true };
}
