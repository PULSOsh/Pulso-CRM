import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ContactsClient } from "@/components/crm/contacts-client";
import { getContacts } from "@/server/actions/contacts";
import { auth } from "@/server/auth";

export default async function ContactsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const contacts = await getContacts();

  return (
    <AppShell active="contacts" eyebrow="COMERCIAL" title="Contatos">
      <ContactsClient initialContacts={contacts} />
    </AppShell>
  );
}
