"use server";

import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  companies,
  contacts,
  opportunities,
  proposalBlocks,
  proposalItems,
  proposalPaymentOptions,
  proposals,
  proposalVersions,
} from "../db/schema";
import { logActivity } from "../services/activity-log";
import {
  type PaymentPlanInput,
  type ProposalBlockInput,
  paymentPlanSchema,
  proposalBlockSchema,
} from "./quotes.schemas";

type InsertOnlyDbClient = Pick<typeof db, "insert">;

async function insertBlocksAndPayment(
  tx: InsertOnlyDbClient,
  versionId: string,
  blocks: ProposalBlockInput[] | undefined,
  paymentPlan: PaymentPlanInput | null | undefined,
  finalTotal: number,
) {
  if (blocks) {
    const parsedBlocks = blocks.map((b) => proposalBlockSchema.parse(b));
    const enabledBlocks = parsedBlocks.filter((b) => b.isEnabled && b.body);
    if (enabledBlocks.length > 0) {
      await tx.insert(proposalBlocks).values(
        enabledBlocks.map((b, index) => ({
          proposalVersionId: versionId,
          blockType: "text_list",
          stableKey: b.stableKey,
          title: b.title || null,
          content: { body: b.body },
          isEnabled: true,
          position: index,
        })),
      );
    }
  }

  if (paymentPlan) {
    const parsed = paymentPlanSchema.parse(paymentPlan);
    if (parsed.entryAmount > 0 || parsed.installmentCount > 0) {
      await tx.insert(proposalPaymentOptions).values({
        proposalVersionId: versionId,
        name: parsed.name,
        description: parsed.description || null,
        entryAmount: parsed.entryAmount.toString(),
        installmentCount: parsed.installmentCount,
        installmentAmount: parsed.installmentAmount.toString(),
        totalAmount: finalTotal.toString(),
        isDefault: true,
        position: 0,
      });
    }
  }
}

// We need a short code like PRO-1234
function generateProposalCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PRP-${num}`;
}

function computeTotals(items: QuoteItemInput[]) {
  let subtotal = 0;
  let totalDiscount = 0;
  items.forEach((item) => {
    subtotal += item.quantity * item.unitPrice;
    totalDiscount += item.discount;
  });
  return { subtotal, totalDiscount, finalTotal: subtotal - totalDiscount };
}

export async function getQuotes() {
  const { organizationId } = await requirePermission("proposals.read");

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

export async function getOpenOpportunities() {
  const { organizationId } = await requirePermission("opportunities.read");

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
  opportunityId: string;
  title: string;
  scope: string;
  terms: string;
  items: QuoteItemInput[];
  validUntil?: string;
  blocks?: ProposalBlockInput[];
  paymentPlan?: PaymentPlanInput | null;
}) {
  const { organizationId, userId } = await requirePermission("proposals.create");

  const proposalId = crypto.randomUUID();
  const versionId = crypto.randomUUID();
  const { subtotal, totalDiscount, finalTotal } = computeTotals(data.items);

  await db.transaction(async (tx) => {
    await tx.insert(proposals).values({
      id: proposalId,
      organizationId,
      opportunityId: data.opportunityId,
      createdBy: userId,
      code: generateProposalCode(),
      title: data.title,
      status: "draft",
      subtotal: subtotal.toString(),
      discount: totalDiscount.toString(),
      total: finalTotal.toString(),
      currentVersionId: versionId,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    });

    await tx.insert(proposalVersions).values({
      id: versionId,
      proposalId,
      versionNumber: 1,
      title: data.title,
      scope: data.scope,
      terms: data.terms,
      subtotal: subtotal.toString(),
      discount: totalDiscount.toString(),
      total: finalTotal.toString(),
      createdBy: userId,
    });

    if (data.items.length > 0) {
      await tx.insert(proposalItems).values(
        data.items.map((item, index) => ({
          id: crypto.randomUUID(),
          proposalVersionId: versionId,
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discount: item.discount.toString(),
          total: (item.quantity * item.unitPrice - item.discount).toString(),
          position: index,
        })),
      );
    }

    await insertBlocksAndPayment(tx, versionId, data.blocks, data.paymentPlan, finalTotal);

    await logActivity(
      {
        organizationId,
        actorUserId: userId,
        type: "proposal",
        title: `Proposta criada: ${data.title}`,
        opportunityId: data.opportunityId,
      },
      tx,
    );
  });

  revalidatePath("/crm/quotes");
  return { success: true, proposalId };
}

export async function getQuoteById(id: string) {
  const { organizationId } = await requirePermission("proposals.read");

  const proposal = await db.query.proposals.findFirst({
    where: and(eq(proposals.id, id), eq(proposals.organizationId, organizationId)),
  });
  if (!proposal) return null;

  const version = proposal.currentVersionId
    ? await db.query.proposalVersions.findFirst({
        where: eq(proposalVersions.id, proposal.currentVersionId),
      })
    : null;

  const items = version
    ? await db.query.proposalItems.findMany({
        where: eq(proposalItems.proposalVersionId, version.id),
        orderBy: (t, { asc }) => [asc(t.position)],
      })
    : [];

  const blocks = version
    ? await db.query.proposalBlocks.findMany({
        where: eq(proposalBlocks.proposalVersionId, version.id),
        orderBy: (t, { asc }) => [asc(t.position)],
      })
    : [];

  const paymentOptions = version
    ? await db.query.proposalPaymentOptions.findMany({
        where: eq(proposalPaymentOptions.proposalVersionId, version.id),
        orderBy: (t, { asc }) => [asc(t.position)],
      })
    : [];

  const allVersions = await db.query.proposalVersions.findMany({
    where: eq(proposalVersions.proposalId, id),
    orderBy: (t, { desc }) => [desc(t.versionNumber)],
    columns: { id: true, versionNumber: true, createdAt: true },
  });

  const opportunity = proposal.opportunityId
    ? await db.query.opportunities.findFirst({
        where: eq(opportunities.id, proposal.opportunityId),
      })
    : null;
  const company =
    opportunity?.companyId != null
      ? await db.query.companies.findFirst({ where: eq(companies.id, opportunity.companyId) })
      : null;
  const contact =
    opportunity?.primaryContactId != null
      ? await db.query.contacts.findFirst({ where: eq(contacts.id, opportunity.primaryContactId) })
      : null;

  return {
    proposal,
    version,
    items,
    blocks,
    paymentOptions,
    allVersions,
    opportunity,
    company,
    contact,
  };
}

export async function publishQuote(id: string) {
  const { organizationId, userId } = await requirePermission("proposals.publish");

  const proposal = await db.query.proposals.findFirst({
    where: and(eq(proposals.id, id), eq(proposals.organizationId, organizationId)),
  });
  if (!proposal) throw new Error("Proposta não encontrada");
  if (proposal.status !== "draft") {
    throw new Error("Apenas propostas em rascunho podem ser publicadas");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(proposals)
      .set({ publicAccessEnabled: true, publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(proposals.id, id));

    await logActivity(
      {
        organizationId,
        actorUserId: userId,
        type: "proposal",
        title: `Proposta publicada: ${proposal.title}`,
        opportunityId: proposal.opportunityId ?? undefined,
      },
      tx,
    );
  });

  revalidatePath("/crm/quotes");
  revalidatePath(`/crm/quotes/${id}`);
  return { success: true };
}

/** Rascunho ainda não publicado: muda livremente, edita a versão existente
 * em vez de criar uma nova (não há snapshot público pra preservar ainda). */
export async function updateQuoteDraft(
  id: string,
  data: {
    title: string;
    scope: string;
    terms: string;
    items: QuoteItemInput[];
    validUntil?: string;
    blocks?: ProposalBlockInput[];
    paymentPlan?: PaymentPlanInput | null;
  },
) {
  const { organizationId } = await requirePermission("proposals.update");

  const proposal = await db.query.proposals.findFirst({
    where: and(eq(proposals.id, id), eq(proposals.organizationId, organizationId)),
  });
  if (!proposal) throw new Error("Proposta não encontrada");
  if (proposal.status !== "draft" || proposal.publicAccessEnabled) {
    throw new Error(
      "Só é possível editar livremente uma proposta em rascunho, ainda não publicada.",
    );
  }
  if (!proposal.currentVersionId) throw new Error("Proposta sem versão ativa.");

  const { subtotal, totalDiscount, finalTotal } = computeTotals(data.items);
  const versionId = proposal.currentVersionId;

  await db.transaction(async (tx) => {
    await tx
      .update(proposals)
      .set({
        title: data.title,
        subtotal: subtotal.toString(),
        discount: totalDiscount.toString(),
        total: finalTotal.toString(),
        updatedAt: new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      })
      .where(eq(proposals.id, id));

    await tx
      .update(proposalVersions)
      .set({
        title: data.title,
        scope: data.scope,
        terms: data.terms,
        subtotal: subtotal.toString(),
        discount: totalDiscount.toString(),
        total: finalTotal.toString(),
      })
      .where(eq(proposalVersions.id, versionId));

    await tx.delete(proposalItems).where(eq(proposalItems.proposalVersionId, versionId));

    if (data.items.length > 0) {
      await tx.insert(proposalItems).values(
        data.items.map((item, index) => ({
          id: crypto.randomUUID(),
          proposalVersionId: versionId,
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discount: item.discount.toString(),
          total: (item.quantity * item.unitPrice - item.discount).toString(),
          position: index,
        })),
      );
    }

    // Blocos e plano de pagamento só são tocados se o chamador explicitamente
    // os enviar - sem isso, uma edição que não sabe desses campos (ex: a tela
    // de detalhe legada) não apaga o que já foi configurado na criação.
    if (data.blocks !== undefined) {
      await tx.delete(proposalBlocks).where(eq(proposalBlocks.proposalVersionId, versionId));
    }
    if (data.paymentPlan !== undefined) {
      await tx
        .delete(proposalPaymentOptions)
        .where(eq(proposalPaymentOptions.proposalVersionId, versionId));
    }
    if (data.blocks !== undefined || data.paymentPlan !== undefined) {
      await insertBlocksAndPayment(tx, versionId, data.blocks, data.paymentPlan, finalTotal);
    }
  });

  revalidatePath(`/crm/quotes/${id}`);
  return { success: true };
}

/** Proposta já publicada: alteração relevante congela a versão atual e cria
 * uma nova, sem apagar a anterior (docs/MODULE_SPECIFICATIONS.md §7). */
export async function createNewProposalVersion(
  id: string,
  data: {
    title: string;
    scope: string;
    terms: string;
    items: QuoteItemInput[];
    validUntil?: string;
    blocks?: ProposalBlockInput[];
    paymentPlan?: PaymentPlanInput | null;
  },
) {
  const { organizationId, userId } = await requirePermission("proposals.update");

  const proposal = await db.query.proposals.findFirst({
    where: and(eq(proposals.id, id), eq(proposals.organizationId, organizationId)),
  });
  if (!proposal) throw new Error("Proposta não encontrada");
  if (!proposal.publicAccessEnabled) {
    throw new Error("Proposta ainda não publicada — edite o rascunho diretamente.");
  }
  if (proposal.status === "approved") {
    throw new Error("Proposta já aceita — a versão aceita não pode ser substituída.");
  }

  const latestVersion = await db.query.proposalVersions.findFirst({
    where: eq(proposalVersions.proposalId, id),
    orderBy: (t, { desc }) => [desc(t.versionNumber)],
  });
  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  // Se o chamador não mandou blocos/pagamento novos, a versão nova herda o
  // que já estava na versão anterior - senão, editar só o escopo/itens numa
  // tela que não conhece esses campos apagaria essa configuração ao virar
  // versão nova.
  let carriedBlocks: ProposalBlockInput[] | undefined = data.blocks;
  let carriedPayment: PaymentPlanInput | null | undefined = data.paymentPlan;
  if (data.blocks === undefined && latestVersion) {
    const previousBlocks = await db.query.proposalBlocks.findMany({
      where: eq(proposalBlocks.proposalVersionId, latestVersion.id),
      orderBy: (t, { asc }) => [asc(t.position)],
    });
    carriedBlocks = previousBlocks.map((b) => ({
      stableKey: b.stableKey as ProposalBlockInput["stableKey"],
      title: b.title ?? undefined,
      body: (b.content as { body?: string })?.body ?? "",
      isEnabled: b.isEnabled,
    }));
  }
  if (data.paymentPlan === undefined && latestVersion) {
    const previousPayment = await db.query.proposalPaymentOptions.findFirst({
      where: eq(proposalPaymentOptions.proposalVersionId, latestVersion.id),
    });
    carriedPayment = previousPayment
      ? {
          name: previousPayment.name,
          description: previousPayment.description ?? "",
          entryAmount: Number(previousPayment.entryAmount),
          installmentCount: previousPayment.installmentCount,
          installmentAmount: Number(previousPayment.installmentAmount),
        }
      : null;
  }

  const { subtotal, totalDiscount, finalTotal } = computeTotals(data.items);
  const newVersionId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(proposalVersions).values({
      id: newVersionId,
      proposalId: id,
      versionNumber: nextVersionNumber,
      title: data.title,
      scope: data.scope,
      terms: data.terms,
      subtotal: subtotal.toString(),
      discount: totalDiscount.toString(),
      total: finalTotal.toString(),
      createdBy: userId,
    });

    if (data.items.length > 0) {
      await tx.insert(proposalItems).values(
        data.items.map((item, index) => ({
          id: crypto.randomUUID(),
          proposalVersionId: newVersionId,
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discount: item.discount.toString(),
          total: (item.quantity * item.unitPrice - item.discount).toString(),
          position: index,
        })),
      );
    }

    await insertBlocksAndPayment(tx, newVersionId, carriedBlocks, carriedPayment, finalTotal);

    if (data.validUntil) {
      await tx
        .update(proposals)
        .set({ validUntil: new Date(data.validUntil) })
        .where(eq(proposals.id, id));
    }

    await tx
      .update(proposals)
      .set({
        title: data.title,
        subtotal: subtotal.toString(),
        discount: totalDiscount.toString(),
        total: finalTotal.toString(),
        currentVersionId: newVersionId,
        status: "draft",
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, id));

    await logActivity(
      {
        organizationId,
        actorUserId: userId,
        type: "proposal",
        title: `Nova versão da proposta (v${nextVersionNumber}): ${data.title}`,
        opportunityId: proposal.opportunityId ?? undefined,
      },
      tx,
    );
  });

  revalidatePath(`/crm/quotes/${id}`);
  return { success: true, versionId: newVersionId };
}
