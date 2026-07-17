import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { auth } from "@/server/auth";
import { db } from "@/server/db/connection";
import { organizationMembers } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getContacts } from "@/server/actions/contacts";
import { ContactsClient } from "@/components/crm/contacts-client";

export default async function ContactsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const member = await db.query.organizationMembers.findFirst({
    where: eq(organizationMembers.userId, session.user.id),
  });

  if (!member) {
    throw new Error("Usuário não pertence a nenhuma organização");
  }

  const contacts = await getContacts(member.organizationId);

  return (
    <AppShell active="contacts" eyebrow="COMERCIAL" title="Contatos">
      <ContactsClient initialContacts={contacts} organizationId={member.organizationId} />
    </AppShell>
  );
}
