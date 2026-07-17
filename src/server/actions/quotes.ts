"use server";

import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { opportunities, proposalItems, proposals, proposalVersions } from "../db/schema";

// We need a short code like PRO-1234
function generateProposalCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PRP-${num}`;
}

export async function getQuotes(organizationId: string) {
  const allQuotes = await db.query.proposals.findMany({
    where: eq(proposals.organizationId, organizationId),
    orderBy: [desc(proposals.createdAt)],
  });

  const oppIds = allQuotes.map((q) => q.opportunityId).filter(Boolean) as string[];
  const opps =
    oppIds.length > 0
      ? await db.query.opportunities.findMany({
          where: (o, { inArray }) => inArray(o.id, oppIds),
        })
      : [];

  const companyIds = opps.map((o) => o.companyId).filter(Boolean) as string[];
  const contactIds = opps.map((o) => o.primaryContactId).filter(Boolean) as string[];

  const allCompanies =
    companyIds.length > 0
      ? await db.query.companies.findMany({
          where: (c, { inArray }) => inArray(c.id, companyIds),
        })
      : [];

  const allContacts =
    contactIds.length > 0
      ? await db.query.contacts.findMany({
          where: (c, { inArray }) => inArray(c.id, contactIds),
        })
      : [];

  return allQuotes.map((quote) => {
    const opp = opps.find((o) => o.id === quote.opportunityId);
    let opportunity = null;
    if (opp) {
      opportunity = {
        ...opp,
        company: allCompanies.find((c) => c.id === opp.companyId),
        contact: allContacts.find((c) => c.id === opp.primaryContactId),
      };
    }
    return {
      ...quote,
      opportunity,
    };
  });
}

export async function getOpenOpportunities(organizationId: string) {
  const opps = await db.query.opportunities.findMany({
    where: and(eq(opportunities.organizationId, organizationId), eq(opportunities.status, "open")),
  });

  const companyIds = opps.map((o) => o.companyId).filter(Boolean) as string[];
  const contactIds = opps.map((o) => o.primaryContactId).filter(Boolean) as string[];

  const allCompanies =
    companyIds.length > 0
      ? await db.query.companies.findMany({
          where: (c, { inArray }) => inArray(c.id, companyIds),
        })
      : [];

  const allContacts =
    contactIds.length > 0
      ? await db.query.contacts.findMany({
          where: (c, { inArray }) => inArray(c.id, contactIds),
        })
      : [];

  return opps.map((opp) => ({
    ...opp,
    company: allCompanies.find((c) => c.id === opp.companyId),
    contact: allContacts.find((c) => c.id === opp.primaryContactId),
  }));
}

export type QuoteItemInput = {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
};

export async function createQuote(data: {
  organizationId: string;
  userId: string;
  opportunityId: string;
  title: string;
  scope: string;
  terms: string;
  items: QuoteItemInput[];
}) {
  const proposalId = crypto.randomUUID();
  const versionId = crypto.randomUUID();
  const publicToken = crypto.randomUUID();

  // Calculate totals
  let subtotal = 0;
  let totalDiscount = 0;

  data.items.forEach((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    subtotal += itemTotal;
    totalDiscount += item.discount;
  });

  const finalTotal = subtotal - totalDiscount;

  // 1. Create Proposal
  await db.insert(proposals).values({
    id: proposalId,
    organizationId: data.organizationId,
    opportunityId: data.opportunityId,
    createdBy: data.userId,
    code: generateProposalCode(),
    title: data.title,
    status: "draft",
    subtotal: subtotal.toString(),
    discount: totalDiscount.toString(),
    total: finalTotal.toString(),
    publicToken,
    currentVersionId: versionId, // Will link to the version we create next
  });

  // 2. Create Initial Version
  await db.insert(proposalVersions).values({
    id: versionId,
    proposalId,
    versionNumber: 1,
    title: data.title,
    scope: data.scope,
    terms: data.terms,
    subtotal: subtotal.toString(),
    discount: totalDiscount.toString(),
    total: finalTotal.toString(),
    createdBy: data.userId,
  });

  // 3. Insert Items
  if (data.items.length > 0) {
    const itemsToInsert = data.items.map((item, index) => ({
      id: crypto.randomUUID(),
      proposalVersionId: versionId,
      productId: item.productId || null,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      discount: item.discount.toString(),
      total: (item.quantity * item.unitPrice - item.discount).toString(),
      position: index,
    }));

    await db.insert(proposalItems).values(itemsToInsert);
  }

  revalidatePath("/crm/quotes");
  return { success: true, proposalId };
}
