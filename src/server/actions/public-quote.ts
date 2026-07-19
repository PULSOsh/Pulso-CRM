"use server";

import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import {
  companies,
  contacts,
  opportunities,
  pipelineStages,
  proposalBlocks,
  proposalItems,
  proposalPaymentOptions,
  proposals,
  proposalVersions,
} from "../db/schema";
import { logActivity } from "../services/activity-log";
import { writeAuditLog } from "../services/audit-log";
import { notifyUser } from "../services/notify";
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

export async function approveProposal(token: string, _signerData: { name: string; email: string }) {
  if (!token) {
    return { success: false, error: "Proposta inválida ou já processada." };
  }

  // 1. Fetch proposal
  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.publicToken, token),
  });

  if (
    !proposal?.publicAccessEnabled ||
    (proposal.status !== "draft" && proposal.status !== "sent" && proposal.status !== "viewed")
  ) {
    return { success: false, error: "Proposta inválida ou já processada." };
  }

  await db.transaction(async (tx) => {
    // 2. Mark proposal as approved
    await tx
      .update(proposals)
      .set({
        status: "approved",
        approvedAt: new Date(),
      })
      .where(eq(proposals.id, proposal.id));

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

  // Note: we'd ideally insert into proposalResponses here, but the schema requires publicLinkId which is for phase 9 extension
  // For the MVP, updating the proposal and opportunity is the core business value.

  return { success: true };
}
