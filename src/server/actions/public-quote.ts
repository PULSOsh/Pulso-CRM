"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "../db/connection";
import {
  companies,
  contacts,
  opportunities,
  pipelineStages,
  proposalBlocks,
  proposalItems,
  proposalPaymentOptions,
  proposalResponses,
  proposals,
  proposalSelectedAddons,
  proposalVersions,
} from "../db/schema";
import { logActivity } from "../services/activity-log";
import { writeAuditLog } from "../services/audit-log";
import { notifyUser } from "../services/notify";
import { tryAutoGenerateContract } from "./contracts";
import { getPublicFilesForEntity } from "./files";

export async function getPublicProposal(token: string) {
  if (!token) {
    return null;
  }

  // 1. Fetch proposal by public token
  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.publicToken, token),
  });

  if (!proposal?.publicAccessEnabled) {
    return null;
  }

  if (!proposal.currentVersionId) {
    return null;
  }

  // CRM-F1-08: expiração. validUntil já existia e era editável, mas nada
  // verificava - uma proposta vencida continuava aceitável indefinidamente.
  // Mesmo padrão já usado por "primeira visualização" nesta função: uma
  // leitura pública pode transicionar o status quando o dado justifica.
  const isPending = ["draft", "sent", "viewed"].includes(proposal.status);
  if (isPending && proposal.validUntil && proposal.validUntil.getTime() < Date.now()) {
    await db.update(proposals).set({ status: "expired" }).where(eq(proposals.id, proposal.id));
    proposal.status = "expired";
  }

  // 2. Fetch the current version
  const version = await db.query.proposalVersions.findFirst({
    where: eq(proposalVersions.id, proposal.currentVersionId),
  });

  if (!version) {
    return null;
  }

  // 3. Fetch the items for this version
  const items = await db.query.proposalItems.findMany({
    where: eq(proposalItems.proposalVersionId, version.id),
    orderBy: (items, { asc }) => [asc(items.position)],
  });

  const blocks = await db.query.proposalBlocks.findMany({
    where: eq(proposalBlocks.proposalVersionId, version.id),
    orderBy: (t, { asc }) => [asc(t.position)],
  });

  const paymentOption = await db.query.proposalPaymentOptions.findFirst({
    where: eq(proposalPaymentOptions.proposalVersionId, version.id),
  });

  // First view only - avoid writing on every reload/refresh of the same link.
  if (!proposal.firstViewedAt) {
    await db.transaction(async (tx) => {
      await tx
        .update(proposals)
        .set({
          firstViewedAt: new Date(),
          status: proposal.status === "draft" ? "viewed" : proposal.status,
        })
        .where(eq(proposals.id, proposal.id));

      await logActivity(
        {
          organizationId: proposal.organizationId,
          actorUserId: null,
          type: "proposal",
          title: `Proposta visualizada pela primeira vez: ${proposal.title}`,
          opportunityId: proposal.opportunityId ?? undefined,
        },
        tx,
      );
    });
  }

  const files = await getPublicFilesForEntity(proposal.organizationId, "proposal", proposal.id);

  // "Preparada para" card (docs/DESIGN_SYSTEM.md reference: proposta_publica.png) -
  // resolved via opportunity -> company/contact, never sent by the client.
  let preparedForName: string | null = null;
  let preparedForContact: string | null = null;
  if (proposal.opportunityId) {
    const opp = await db.query.opportunities.findFirst({
      where: eq(opportunities.id, proposal.opportunityId),
      columns: { companyId: true, primaryContactId: true },
    });
    if (opp?.companyId) {
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, opp.companyId),
        columns: { tradeName: true },
      });
      preparedForName = company?.tradeName ?? null;
    }
    if (opp?.primaryContactId) {
      const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, opp.primaryContactId),
        columns: { firstName: true, lastName: true },
      });
      preparedForContact = contact ? `${contact.firstName} ${contact.lastName ?? ""}`.trim() : null;
    }
  }

  // We return a safe, sanitized object containing only what the client needs to see
  return {
    code: proposal.code,
    title: proposal.title,
    status: proposal.status,
    total: proposal.total,
    subtotal: proposal.subtotal,
    discount: proposal.discount,
    validUntil: proposal.validUntil,
    createdAt: proposal.createdAt,
    preparedForName,
    preparedForContact,
    version: {
      scope: version.scope,
      terms: version.terms,
    },
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      isOptional: item.isOptional,
    })),
    blocks: blocks.map((b) => ({
      stableKey: b.stableKey,
      title: b.title,
      body: (b.content as { body?: string })?.body ?? "",
    })),
    paymentPlan: paymentOption
      ? {
          name: paymentOption.name,
          description: paymentOption.description,
          entryAmount: paymentOption.entryAmount,
          installmentCount: paymentOption.installmentCount,
          installmentAmount: paymentOption.installmentAmount,
          totalAmount: paymentOption.totalAmount,
        }
      : null,
    files,
  };
}

export async function approveProposal(
  token: string,
  signerData: { name: string; email: string },
  selectedOptionalItemIds: string[] = [],
) {
  if (!token) {
    return { success: false, error: "Proposta inválida ou já processada." };
  }

  // 1. Fetch proposal
  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.publicToken, token),
  });

  if (
    !proposal?.publicAccessEnabled ||
    (proposal.status !== "draft" && proposal.status !== "sent" && proposal.status !== "viewed") ||
    !proposal.currentVersionId
  ) {
    return { success: false, error: "Proposta inválida ou já processada." };
  }

  // CRM-F1-08: revalida expiração no momento do aceite (defesa em
  // profundidade - a página pública já marca como "expired" na leitura, mas
  // uma aba aberta antes do vencimento não deve conseguir aceitar depois).
  if (proposal.validUntil && proposal.validUntil.getTime() < Date.now()) {
    await db.update(proposals).set({ status: "expired" }).where(eq(proposals.id, proposal.id));
    return { success: false, error: "Esta proposta expirou." };
  }

  // CRM-F1-06: itens opcionais da versão aceita - o cliente escolhe quais
  // incluir no momento do aceite. proposal_selected_addons (schema existia
  // desde a fundação, nunca usado) registra o que foi oferecido e o que foi
  // escolhido, com o valor congelado no momento do aceite.
  const versionItems = await db.query.proposalItems.findMany({
    where: eq(proposalItems.proposalVersionId, proposal.currentVersionId),
  });
  const optionalItems = versionItems.filter((item) => item.isOptional);
  const selectedIdSet = new Set(
    selectedOptionalItemIds.filter((id) => optionalItems.some((item) => item.id === id)),
  );

  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip");
  const userAgent = requestHeaders.get("user-agent");

  const snapshotHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        proposalId: proposal.id,
        versionId: proposal.currentVersionId,
        items: versionItems.map((i) => ({ id: i.id, total: i.total })),
        selectedOptionalItemIds: [...selectedIdSet].sort(),
      }),
    )
    .digest("hex");

  await db.transaction(async (tx) => {
    // 2. Mark proposal as approved
    await tx
      .update(proposals)
      .set({
        status: "approved",
        approvedAt: new Date(),
      })
      .where(eq(proposals.id, proposal.id));

    // 2b. Evidência formal do aceite - a UI já promete isso ("Aceite registra
    // nome, e-mail, data e IP como evidência"), mas antes desta story nada
    // gravava em proposal_responses.
    const [response] = await tx
      .insert(proposalResponses)
      .values({
        proposalId: proposal.id,
        proposalVersionId: proposal.currentVersionId as string,
        responseType: "accepted",
        signerName: signerData.name,
        signerEmail: signerData.email,
        snapshotHash,
        ipAddress,
        userAgent,
      })
      .returning({ id: proposalResponses.id });

    if (optionalItems.length > 0) {
      await tx.insert(proposalSelectedAddons).values(
        optionalItems.map((item) => ({
          responseId: response.id,
          proposalItemId: item.id,
          selected: selectedIdSet.has(item.id),
          amountSnapshot: item.total,
        })),
      );
    }

    // 3. Move Opportunity in Kanban
    if (proposal.opportunityId) {
      const opp = await tx.query.opportunities.findFirst({
        where: eq(opportunities.id, proposal.opportunityId),
      });

      if (opp) {
        const stages = await tx.query.pipelineStages.findMany({
          where: eq(pipelineStages.pipelineId, opp.pipelineId),
          orderBy: (stages, { desc }) => [desc(stages.position)],
        });

        // Usually the last stage or a stage marked 'isWon'. We assume last stage for MVP if isWon is not set.
        const wonStage = stages.find((s) => s.isWon) || stages[0];

        if (wonStage) {
          await tx
            .update(opportunities)
            .set({
              status: "won",
              stageId: wonStage.id,
              wonAt: new Date(),
            })
            .where(eq(opportunities.id, opp.id));
        }

        if (opp.ownerUserId) {
          await notifyUser(
            {
              organizationId: proposal.organizationId,
              userId: opp.ownerUserId,
              type: "proposal.accepted",
              title: `Proposta aceita: ${proposal.title}`,
              actionUrl: `/crm/quotes/${proposal.id}`,
            },
            tx,
          );
        }
      }
    }

    await logActivity(
      {
        organizationId: proposal.organizationId,
        actorUserId: null,
        type: "proposal",
        title: `Proposta aceita pelo cliente: ${proposal.title}`,
        opportunityId: proposal.opportunityId ?? undefined,
      },
      tx,
    );

    await writeAuditLog(
      {
        organizationId: proposal.organizationId,
        actorUserId: null,
        action: "proposal.accepted",
        entityType: "proposal",
        entityId: proposal.id,
        before: { status: proposal.status },
        after: { status: "approved" },
      },
      tx,
    );
  });

  // CRM-F1-10: gera o contrato automaticamente no aceite, fora da transação
  // principal - uma falha aqui não deve impedir a confirmação de aceite que
  // o cliente já viu (tryAutoGenerateContract nunca lança, só loga e segue).
  await tryAutoGenerateContract(proposal.organizationId, proposal.id);

  return { success: true };
}
