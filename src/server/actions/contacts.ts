"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { contacts } from "../db/schema";

export async function getContacts() {
  const { organizationId } = await requirePermission("contacts.read");

  return await db.query.contacts.findMany({
    where: eq(contacts.organizationId, organizationId),
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
