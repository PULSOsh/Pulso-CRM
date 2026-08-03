"use server";

import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { companies, companyContacts, contacts } from "../db/schema";
import { updateContactSchema } from "./contacts.schemas";

export async function getContacts() {
  const { organizationId } = await requirePermission("contacts.read");

  return await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      whatsapp: contacts.whatsapp,
      jobTitle: contacts.jobTitle,
      createdAt: contacts.createdAt,
      companyId: companyContacts.companyId,
      companyName: companies.tradeName,
    })
    .from(contacts)
    .leftJoin(
      companyContacts,
      and(eq(companyContacts.contactId, contacts.id), eq(companyContacts.isPrimary, true)),
    )
    .leftJoin(
      companies,
      and(eq(companies.id, companyContacts.companyId), eq(companies.organizationId, organizationId)),
    )
    .where(and(eq(contacts.organizationId, organizationId), isNull(contacts.deletedAt)))
    .orderBy(desc(contacts.createdAt));
}

// companyId vem do cliente em createContact/updateContact - resolve o nome só
// depois de confirmar que a empresa pertence à organização da sessão, senão
// um usuário poderia vincular (e a UI mostraria o nome de) uma empresa de
// outra organização.
async function findOwnedCompanyName(companyId: string, organizationId: string) {
  const company = await db.query.companies.findFirst({
    where: and(eq(companies.id, companyId), eq(companies.organizationId, organizationId)),
    columns: { tradeName: true },
  });
  if (!company) throw new Error("Empresa não encontrada.");
  return company.tradeName;
}

export async function createContact(input: unknown) {
  const { organizationId } = await requirePermission("contacts.create");
  const parsed = updateContactSchema.parse(input);

  const [contact] = await db
    .insert(contacts)
    .values({
      organizationId,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      whatsapp: parsed.whatsapp,
      jobTitle: parsed.jobTitle,
    })
    .returning();

  let companyName: string | null = null;
  if (parsed.companyId) {
    companyName = await findOwnedCompanyName(parsed.companyId, organizationId);
    await db
      .insert(companyContacts)
      .values({ companyId: parsed.companyId, contactId: contact.id, isPrimary: true });
  }

  revalidatePath("/crm/contatos");
  return { ...contact, companyId: parsed.companyId || null, companyName };
}

export async function updateContact(contactId: string, input: unknown) {
  const { organizationId } = await requirePermission("contacts.update");
  const parsed = updateContactSchema.parse(input);

  const [updated] = await db
    .update(contacts)
    .set({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      whatsapp: parsed.whatsapp,
      jobTitle: parsed.jobTitle,
      updatedAt: new Date(),
    })
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .returning({ id: contacts.id });

  if (!updated) throw new Error("Contato não encontrado.");

  // Simple 1:1 model for this slice: replace whatever primary company link
  // existed with the one chosen in the form (or none).
  await db.delete(companyContacts).where(eq(companyContacts.contactId, contactId));
  let companyName: string | null = null;
  if (parsed.companyId) {
    companyName = await findOwnedCompanyName(parsed.companyId, organizationId);
    await db
      .insert(companyContacts)
      .values({ companyId: parsed.companyId, contactId, isPrimary: true });
  }

  revalidatePath("/crm/contatos");
  return { success: true, companyId: parsed.companyId || null, companyName };
}

export async function deleteContact(contactId: string) {
  const { organizationId } = await requirePermission("contacts.delete");

  const [updated] = await db
    .update(contacts)
    .set({ deletedAt: new Date() })
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .returning({ id: contacts.id });

  if (!updated) throw new Error("Contato não encontrado.");

  revalidatePath("/crm/contatos");
  return { success: true };
}

export async function getDeletedContacts() {
  const { organizationId } = await requirePermission("contacts.restore");

  return await db.query.contacts.findMany({
    where: and(eq(contacts.organizationId, organizationId), isNotNull(contacts.deletedAt)),
    orderBy: (contacts, { desc }) => [desc(contacts.deletedAt)],
  });
}

export async function restoreContact(contactId: string) {
  const { organizationId } = await requirePermission("contacts.restore");

  const [updated] = await db
    .update(contacts)
    .set({ deletedAt: null })
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .returning({ id: contacts.id });

  if (!updated) throw new Error("Contato não encontrado.");

  revalidatePath("/crm/contatos");
  return { success: true };
}
