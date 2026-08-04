"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  contractEvents,
  contracts,
  opportunities,
  organizations,
  proposalBlocks,
  proposalItems,
  proposalPaymentOptions,
  proposals,
  proposalVersions,
} from "../db/schema";
import { logger } from "../logger";
import { writeAuditLog } from "../services/audit-log";
import { notifyUser } from "../services/notify";
import { tryAutoGenerateReceivable } from "./finance";
import { tryAutoGenerateProject } from "./projects";

export async function getContracts() {
  const { organizationId } = await requirePermission("contracts.read");

  return await db.query.contracts.findMany({
    where: eq(contracts.organizationId, organizationId),
    orderBy: [desc(contracts.createdAt)],
  });
}

/** Um contrato é gerado a partir de uma proposta aprovada (snapshot em texto
 * preservado em `content`), mas telas internas/públicas reaproveitam os dados
 * estruturados da proposta de origem (itens/blocos/pagamento) pra renderizar
 * em seções, em vez de um bloco de texto único. */
async function getContractProposalContent(proposalId: string | null) {
  let items: {
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }[] = [];
  let blocks: { stableKey: string; title: string | null; body: string }[] = [];
  let paymentPlan: {
    description: string | null;
    entryAmount: string;
    installmentCount: number;
    installmentAmount: string;
    totalAmount: string;
  } | null = null;
  let scope: string | null = null;

  if (!proposalId) return { scope, items, blocks, paymentPlan };

  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.id, proposalId),
    columns: { currentVersionId: true },
  });
  if (!proposal?.currentVersionId) return { scope, items, blocks, paymentPlan };

  const version = await db.query.proposalVersions.findFirst({
    where: eq(proposalVersions.id, proposal.currentVersionId),
    columns: { scope: true },
  });
  scope = version?.scope ?? null;

  items = await db.query.proposalItems.findMany({
    where: eq(proposalItems.proposalVersionId, proposal.currentVersionId),
    orderBy: (t, { asc }) => [asc(t.position)],
  });

  const rawBlocks = await db.query.proposalBlocks.findMany({
    where: eq(proposalBlocks.proposalVersionId, proposal.currentVersionId),
    orderBy: (t, { asc }) => [asc(t.position)],
  });
  blocks = rawBlocks.map((b) => ({
    stableKey: b.stableKey,
    title: b.title,
    body: (b.content as { body?: string })?.body ?? "",
  }));

  const paymentOption = await db.query.proposalPaymentOptions.findFirst({
    where: eq(proposalPaymentOptions.proposalVersionId, proposal.currentVersionId),
  });
  paymentPlan = paymentOption
    ? {
        description: paymentOption.description,
        entryAmount: paymentOption.entryAmount,
        installmentCount: paymentOption.installmentCount,
        installmentAmount: paymentOption.installmentAmount,
        totalAmount: paymentOption.totalAmount,
      }
    : null;

  return { scope, items, blocks, paymentPlan };
}

export async function getContractById(id: string) {
  const { organizationId } = await requirePermission("contracts.read");

  const contract = await db.query.contracts.findFirst({
    where: and(eq(contracts.id, id), eq(contracts.organizationId, organizationId)),
  });
  if (!contract) return null;

  const proposalContent = await getContractProposalContent(contract.proposalId);
  return { ...contract, ...proposalContent };
}

async function nextContractCode(organizationId: string) {
  const [last] = await db.query.contracts.findMany({
    where: eq(contracts.organizationId, organizationId),
    orderBy: [desc(contracts.createdAt)],
    limit: 1,
  });
  const lastNumber = last ? Number(last.code.replace(/\D/g, "")) || 0 : 0;
  return `CTR-${String(lastNumber + 1).padStart(4, "0")}`;
}

function buildContractContent(params: {
  organizationName: string;
  proposalTitle: string;
  proposalCode: string;
  items: { description: string; quantity: string; unitPrice: string; total: string }[];
  total: string;
  scope: string | null;
  terms: string | null;
  payment: {
    description: string | null;
    entryAmount: string;
    installmentCount: number;
    installmentAmount: string;
  } | null;
  responsibilities: string | null;
  notIncluded: string | null;
}) {
  const itemLines = params.items
    .map(
      (item) => `- ${item.description} (${item.quantity}x R$ ${item.unitPrice}) — R$ ${item.total}`,
    )
    .join("\n");

  const paymentSection = params.payment
    ? [
        params.payment.description,
        Number(params.payment.entryAmount) > 0
          ? `- Entrada: R$ ${params.payment.entryAmount}`
          : null,
        params.payment.installmentCount > 0
          ? `- ${params.payment.installmentCount}x de R$ ${params.payment.installmentAmount}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "A definir entre as partes.";

  const sections = [
    `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Contratada: ${params.organizationName}
Referente à proposta: ${params.proposalCode} - ${params.proposalTitle}

ESCOPO
${params.scope || "Conforme descrito na proposta comercial vinculada."}

ITENS CONTRATADOS
${itemLines || "- Nenhum item registrado na proposta."}

VALOR TOTAL
R$ ${params.total}

CONDIÇÃO DE PAGAMENTO
${paymentSection}`,
  ];

  if (params.responsibilities) {
    sections.push(`RESPONSABILIDADES DO CONTRATANTE\n${params.responsibilities}`);
  }
  if (params.notIncluded) {
    sections.push(`O QUE NÃO ESTÁ INCLUSO NESTE CONTRATO\n${params.notIncluded}`);
  }

  sections.push(`CONDIÇÕES GERAIS
${params.terms || "A definir entre as partes."}

Este documento reflete o snapshot da proposta aprovada no momento da geração do contrato.`);

  return sections.join("\n\n");
}

// Núcleo reaproveitável (CRM-F1-10): chamado tanto pela action autenticada
// createContractFromProposal (abaixo) quanto pelo aceite público da proposta
// (public-quote.ts::approveProposal), que não tem sessão/userId - por isso
// actorUserId é nullable e nenhuma chamada a requirePermission() acontece
// aqui (o chamador já resolveu autorização do jeito certo pro seu contexto).
// Retorna null (em vez de lançar) se já existir contrato, pra deixar o
// aceite automático seguir sem erro quando o contrato já tiver sido gerado
// manualmente antes.
async function createContractForApprovedProposal(
  organizationId: string,
  proposalId: string,
  actorUserId: string | null,
) {
  const proposal = await db.query.proposals.findFirst({
    where: and(eq(proposals.id, proposalId), eq(proposals.organizationId, organizationId)),
  });

  if (!proposal) throw new Error("Proposta não encontrada");
  if (proposal.status !== "approved") {
    throw new Error("Só é possível gerar contrato a partir de uma proposta aprovada");
  }
  if (!proposal.currentVersionId) {
    throw new Error("Proposta não possui uma versão publicada");
  }

  const existingContract = await db.query.contracts.findFirst({
    where: and(eq(contracts.proposalId, proposal.id), eq(contracts.organizationId, organizationId)),
  });
  if (existingContract) return null;

  const version = await db.query.proposalVersions.findFirst({
    where: eq(proposalVersions.id, proposal.currentVersionId),
  });

  const items = await db.query.proposalItems.findMany({
    where: eq(proposalItems.proposalVersionId, proposal.currentVersionId),
    orderBy: (t, { asc }) => [asc(t.position)],
  });

  const blocks = await db.query.proposalBlocks.findMany({
    where: eq(proposalBlocks.proposalVersionId, proposal.currentVersionId),
  });
  const responsibilitiesBlock = blocks.find((b) => b.stableKey === "responsibilities");
  const notIncludedBlock = blocks.find((b) => b.stableKey === "not_included");

  const paymentOption = await db.query.proposalPaymentOptions.findFirst({
    where: eq(proposalPaymentOptions.proposalVersionId, proposal.currentVersionId),
  });

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  const code = await nextContractCode(organizationId);
  const content = buildContractContent({
    organizationName: organization?.name ?? "PULSO",
    proposalTitle: proposal.title,
    proposalCode: proposal.code,
    items,
    total: proposal.total,
    payment: paymentOption
      ? {
          description: paymentOption.description,
          entryAmount: paymentOption.entryAmount,
          installmentCount: paymentOption.installmentCount,
          installmentAmount: paymentOption.installmentAmount,
        }
      : null,
    responsibilities: (responsibilitiesBlock?.content as { body?: string })?.body ?? null,
    notIncluded: (notIncludedBlock?.content as { body?: string })?.body ?? null,
    scope: version?.scope ?? null,
    terms: version?.terms ?? null,
  });

  return db.transaction(async (tx) => {
    const [contract] = await tx
      .insert(contracts)
      .values({
        organizationId,
        opportunityId: proposal.opportunityId,
        proposalId: proposal.id,
        createdBy: actorUserId,
        code,
        title: proposal.title,
        status: "draft",
        content,
      })
      .returning();

    await tx.insert(contractEvents).values({
      contractId: contract.id,
      eventType: "created",
      actorUserId,
    });

    return contract;
  });
}

export async function createContractFromProposal(proposalId: string) {
  const { organizationId, userId } = await requirePermission("contracts.create");
  const contract = await createContractForApprovedProposal(organizationId, proposalId, userId);
  if (!contract) throw new Error("Esta proposta já possui um contrato gerado.");

  revalidatePath("/crm/contratos");
  return contract;
}

// Chamado pelo aceite público da proposta (CRM-F1-10) - gera o contrato
// automaticamente, sem exigir que alguém da equipe clique manualmente.
// Nunca lança: uma falha aqui não deve derrubar a confirmação de aceite que
// o cliente já viu na tela; fica registrado no log de erro estruturado
// (F0-09) pra follow-up manual via o botão "Gerar Contrato" já existente.
export async function tryAutoGenerateContract(organizationId: string, proposalId: string) {
  try {
    return await createContractForApprovedProposal(organizationId, proposalId, null);
  } catch (error) {
    logger.error("Falha ao gerar contrato automaticamente após aceite de proposta", {
      organizationId,
      proposalId,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getApprovedProposalsWithoutContract() {
  const { organizationId } = await requirePermission("contracts.read");

  const approvedProposals = await db.query.proposals.findMany({
    where: and(eq(proposals.organizationId, organizationId), eq(proposals.status, "approved")),
  });

  const existingContracts = await db.query.contracts.findMany({
    where: eq(contracts.organizationId, organizationId),
  });
  const proposalIdsWithContract = new Set(
    existingContracts.map((c) => c.proposalId).filter(Boolean),
  );

  return approvedProposals.filter((p) => !proposalIdsWithContract.has(p.id));
}

export async function sendContract(id: string) {
  const { userId } = await requirePermission("contracts.send");

  const contract = await getContractById(id);
  if (!contract) throw new Error("Contrato não encontrado");
  if (contract.status !== "draft")
    throw new Error("Apenas contratos em rascunho podem ser enviados");

  await db
    .update(contracts)
    .set({ status: "sent", sentAt: new Date(), publicAccessEnabled: true, updatedAt: new Date() })
    .where(eq(contracts.id, id));

  await db.insert(contractEvents).values({
    contractId: id,
    eventType: "sent",
    actorUserId: userId,
  });

  revalidatePath("/crm/contratos");
  revalidatePath(`/crm/contratos/${id}`);
  return { success: true };
}

export async function cancelContract(id: string, reason: string) {
  const { userId } = await requirePermission("contracts.cancel");

  const contract = await getContractById(id);
  if (!contract) throw new Error("Contrato não encontrado");
  if (contract.status === "signed") throw new Error("Contrato assinado não pode ser cancelado");

  await db
    .update(contracts)
    .set({ status: "cancelled", publicAccessEnabled: false, updatedAt: new Date() })
    .where(eq(contracts.id, id));

  await db.insert(contractEvents).values({
    contractId: id,
    eventType: "cancelled",
    actorUserId: userId,
    metadata: { reason },
  });

  revalidatePath("/crm/contratos");
  revalidatePath(`/crm/contratos/${id}`);
  return { success: true };
}

export async function getPublicContract(token: string) {
  if (!token) return null;

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.publicToken, token),
  });

  if (!contract?.publicAccessEnabled) return null;

  const proposalContent = await getContractProposalContent(contract.proposalId);

  return {
    code: contract.code,
    title: contract.title,
    status: contract.status,
    content: contract.content,
    signedAt: contract.signedAt,
    createdAt: contract.createdAt,
    ...proposalContent,
  };
}

export async function signContractPublic(
  token: string,
  signerData: { name: string; document?: string },
) {
  if (!token) return { success: false, error: "Contrato inválido." };

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.publicToken, token),
  });

  if (!contract?.publicAccessEnabled || contract.status !== "sent") {
    return { success: false, error: "Contrato inválido ou já processado." };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = requestHeaders.get("user-agent") ?? undefined;

  await db.transaction(async (tx) => {
    await tx
      .update(contracts)
      .set({
        status: "signed",
        signedAt: new Date(),
        signerName: signerData.name,
        signerDocument: signerData.document,
        signerIp: ip,
        signerUserAgent: userAgent,
        signatureEvidence: {
          name: signerData.name,
          document: signerData.document ?? null,
          signedAt: new Date().toISOString(),
          ip: ip ?? null,
          userAgent: userAgent ?? null,
        },
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contract.id));

    await tx.insert(contractEvents).values({
      contractId: contract.id,
      eventType: "signed",
      ipAddress: ip,
      userAgent,
      metadata: { signerName: signerData.name },
    });

    if (contract.opportunityId) {
      const opp = await tx.query.opportunities.findFirst({
        where: eq(opportunities.id, contract.opportunityId),
      });
      if (opp?.ownerUserId) {
        await notifyUser(
          {
            organizationId: contract.organizationId,
            userId: opp.ownerUserId,
            type: "contract.signed",
            title: `Contrato assinado: ${contract.title}`,
            actionUrl: `/crm/contratos/${contract.id}`,
          },
          tx,
        );
      }
    }

    await writeAuditLog(
      {
        organizationId: contract.organizationId,
        actorUserId: null,
        action: "contract.signed",
        entityType: "contract",
        entityId: contract.id,
        before: { status: contract.status },
        after: { status: "signed", signerName: signerData.name },
        ipAddress: ip,
        userAgent,
      },
      tx,
    );
  });

  // CRM-F1-10: gera projeto e recebível automaticamente na assinatura, fora
  // da transação principal - uma falha aqui não deve impedir a confirmação
  // de assinatura que o cliente já viu (as duas funções nunca lançam, só
  // logam e seguem). Dono do projeto herda o responsável da oportunidade,
  // já que não há sessão/usuário atual neste fluxo público.
  const opp = contract.opportunityId
    ? await db.query.opportunities.findFirst({
        where: eq(opportunities.id, contract.opportunityId),
        columns: { ownerUserId: true },
      })
    : null;

  await tryAutoGenerateProject(contract.organizationId, contract.id, opp?.ownerUserId ?? null);

  const proposal = contract.proposalId
    ? await db.query.proposals.findFirst({
        where: eq(proposals.id, contract.proposalId),
        columns: { total: true },
      })
    : null;
  if (proposal) {
    await tryAutoGenerateReceivable(
      contract.organizationId,
      contract.id,
      proposal.total,
      contract.title,
    );
  }

  revalidatePath(`/crm/contratos/${contract.id}`);
  return { success: true };
}
