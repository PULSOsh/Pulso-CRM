"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { contacts } from "../db/schema";
import { auth } from "../auth";
import { headers } from "next/headers";

export async function getContacts(organizationId: string) {
  return await db.query.contacts.findMany({
    where: eq(contacts.organizationId, organizationId),
    orderBy: (contacts, { desc }) => [desc(contacts.createdAt)],
  });
}

export async function createContact(data: {
  organizationId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  jobTitle?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");

  const [contact] = await db
    .insert(contacts)
    .values({
      organizationId: data.organizationId,
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
