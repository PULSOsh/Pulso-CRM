import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { TicketsClient } from "@/components/crm/tickets/tickets-client";
import { getOrganizationMembers } from "@/server/actions/members";
import { getTickets } from "@/server/actions/tickets";
import { auth } from "@/server/auth";

export default async function TicketsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [tickets, members] = await Promise.all([getTickets(), getOrganizationMembers()]);

  return (
    <AppShell active="tickets" eyebrow="OPERAÇÃO" title="Atendimento">
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        <TicketsClient tickets={tickets} members={members} />
      </div>
    </AppShell>
  );
}
