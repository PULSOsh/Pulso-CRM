"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { contacts } from "../db/schema";
import { updateContactSchema } from "./contacts.schemas";

export async function getContacts() {
  const { organizationId } = await requirePermission("contacts.read");

  return await db.query.contacts.findMany({
    where: and(eq(contacts.organizationId, organizationId), isNull(contacts.deletedAt)),
    orderBy: (contacts, { desc }) => [desc(contacts.createdAt)],
  });
}

export async function createContact(data: {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  jobTitle?: string;
}) {
  const { organizationId } = await requirePermission("contacts.create");

  const [contact] = await db
    .insert(contacts)
    .values({
      organizationId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      jobTitle: data.jobTitle,
    })
    .returning();

  revalidatePath("/crm/contatos");
  return contact;
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

  revalidatePath("/crm/contatos");
  return { success: true };
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
