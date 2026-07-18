"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import {
  opportunities,
  pipelineStages,
  proposalItems,
  proposals,
  proposalVersions,
} from "../db/schema";

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

  if (!proposal?.publicAccessEnabled || proposal.status !== "draft") {
    return { success: false, error: "Proposta inválida ou já processada." };
  }

  // 2. Mark proposal as approved
  await db
    .update(proposals)
    .set({
      status: "approved",
      approvedAt: new Date(),
    })
    .where(eq(proposals.id, proposal.id));

  // 3. Move Opportunity in Kanban
  if (proposal.opportunityId) {
    // Find the 'won' stage for the organization
    // For MVP, we'll try to find a stage named "Ganho" or "Won", or just the one with highest position
    const opp = await db.query.opportunities.findFirst({
      where: eq(opportunities.id, proposal.opportunityId),
    });

    if (opp) {
      const stages = await db.query.pipelineStages.findMany({
        where: eq(pipelineStages.pipelineId, opp.pipelineId),
        orderBy: (stages, { desc }) => [desc(stages.position)],
      });

      // Usually the last stage or a stage marked 'isWon'. We assume last stage for MVP if isWon is not set.
      const wonStage = stages.find((s) => s.isWon) || stages[0];

      if (wonStage) {
        await db
          .update(opportunities)
          .set({
            status: "won",
            stageId: wonStage.id,
            wonAt: new Date(),
          })
          .where(eq(opportunities.id, opp.id));
      }
    }
  }

  // 4. Save response record
  // We mock a hash for the snapshot
  const _snapshotHash = crypto.randomUUID();

  // Note: we'd ideally insert into proposalResponses here, but the schema requires publicLinkId which is for phase 9 extension
  // For the MVP, updating the proposal and opportunity is the core business value.

  return { success: true };
}
