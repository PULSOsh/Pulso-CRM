"use server";

import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { proposalItems, proposals, proposalVersions } from "../db/schema";

export async function getPublicProposal(token: string) {
  // 1. Fetch proposal by public token
  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.publicToken, token),
  });

  if (!proposal?.currentVersionId) {
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
