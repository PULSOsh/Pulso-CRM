import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { auth } from "@/server/auth";
import { db } from "@/server/db/connection";
import { organizationMembers } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getCompanies } from "@/server/actions/companies";
import { CompaniesClient } from "@/components/crm/companies-client";

export default async function CompaniesPage() {
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

  const companies = await getCompanies(member.organizationId);

  return (
    <AppShell active="companies" eyebrow="COMERCIAL" title="Empresas">
      <CompaniesClient initialCompanies={companies} organizationId={member.organizationId} />
    </AppShell>
  );
}
