"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { briefingSubmissions, companies, contacts, opportunities, pipelineStages } from "../db/schema";
import { ensureDefaultPipeline } from "./pipeline";

export async function getBriefingSubmissions() {
  const { organizationId } = await requirePermission("briefings.read");

  return await db.query.briefingSubmissions.findMany({
    where: eq(briefingSubmissions.organizationId, organizationId),
    orderBy: [desc(briefingSubmissions.createdAt)],
    with: {
      template: {
        columns: {
          name: true,
          publicTitle: true,
        },
      },
    },
  });
}

export async function getBriefingSubmissionById(id: string) {
  const { organizationId } = await requirePermission("briefings.read");

  return await db.query.briefingSubmissions.findFirst({
    where: and(
      eq(briefingSubmissions.id, id),
      eq(briefingSubmissions.organizationId, organizationId),
    ),
    with: {
      template: true,
      answers: true,
      contact: true,
      company: true,
      opportunity: true,
    },
  });
}

export async function approveBriefingSubmission(id: string) {
  const { organizationId, userId } = await requirePermission("briefings.review");

  const submission = await getBriefingSubmissionById(id);
  if (!submission) throw new Error("Submissão não encontrada");
  if (submission.status === "linked") throw new Error("Submissão já foi aprovada e vinculada");

  // Bootstrap idempotente do funil padrão (mesma lógica de pipeline.ts,
  // incluindo a etapa "Perdido"/isLost) - fora da transação de propósito,
  // porque criar/reparar o funil padrão não deve ser desfeito se a inserção
  // da oportunidade falhar depois. Corrige um bug real: antes desta story,
  // esta action buscava "o" primeiro funil da organização sem filtrar por
  // isDefault - inofensivo com um funil só, mas desde CRM-F0-02 (múltiplos
  // funis) podia jogar o lead num funil secundário aleatório.
  const defaultPipeline = await ensureDefaultPipeline(organizationId);

  const firstStage = await db.query.pipelineStages.findFirst({
    where: eq(pipelineStages.pipelineId, defaultPipeline.id),
    orderBy: [asc(pipelineStages.position)],
  });
  if (!firstStage) {
    throw new Error("O funil configurado não possui etapas.");
  }

  const opportunityId = await db.transaction(async (tx) => {
    // 1. Check or Create Contact
    let contactId = submission.contactId;
    if (!contactId && submission.contactEmail) {
      const existingContact = await tx.query.contacts.findFirst({
        where: and(
          eq(contacts.organizationId, organizationId),
          eq(contacts.email, submission.contactEmail),
        ),
      });

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const [newContact] = await tx
          .insert(contacts)
          .values({
            organizationId,
            firstName: submission.contactName?.split(" ")[0] || "Desconhecido",
            lastName: submission.contactName?.split(" ").slice(1).join(" ") || "",
            email: submission.contactEmail,
            origin: "public_briefing",
            ownerUserId: userId,
          })
          .returning();
        contactId = newContact.id;
      }
    }

    // 2. Check or Create Company (if provided)
    let companyId = submission.companyId;
    if (!companyId && submission.companyName) {
      const [newCompany] = await tx
        .insert(companies)
        .values({
          organizationId,
          tradeName: submission.companyName,
          ownerUserId: userId,
        })
        .returning();
      companyId = newCompany.id;
      // Link contact to company could be added here in company_contacts table
    }

    // 3. Create Opportunity in default Pipeline
    const [newOpportunity] = await tx
      .insert(opportunities)
      .values({
        organizationId,
        pipelineId: defaultPipeline.id,
        stageId: firstStage.id, // First stage
        title: `Oportunidade - ${submission.companyName || submission.contactName}`,
        primaryContactId: contactId,
        companyId,
        ownerUserId: userId,
        source: "public_briefing",
        estimatedValue: "0.00",
      })
      .returning();

    // 4. Update Submission Status
    await tx
      .update(briefingSubmissions)
      .set({
        status: "linked",
        contactId,
        companyId,
        opportunityId: newOpportunity.id,
        updatedAt: new Date(),
      })
      .where(eq(briefingSubmissions.id, id));

    return newOpportunity.id;
  });

  revalidatePath("/crm/briefings/inbox");
  revalidatePath(`/crm/briefings/inbox/${id}`);
  revalidatePath("/crm/pipeline");

  return { success: true, opportunityId };
}
