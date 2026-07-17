import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { CompaniesClient } from "@/components/crm/companies-client";
import { getCompanies } from "@/server/actions/companies";
import { auth } from "@/server/auth";

export default async function CompaniesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const companies = await getCompanies();

  return (
    <AppShell active="companies" eyebrow="COMERCIAL" title="Empresas">
      <CompaniesClient initialCompanies={companies} />
    </AppShell>
  );
}
