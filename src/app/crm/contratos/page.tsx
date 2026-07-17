import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ContractsClient } from "@/components/crm/contracts-client";
import { getApprovedProposalsWithoutContract, getContracts } from "@/server/actions/contracts";
import { getActiveOrganizationId } from "@/server/actions/organization";
import { auth } from "@/server/auth";

export default async function ContractsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const orgId = await getActiveOrganizationId(session.user.id);

  const [contracts, availableProposals] = await Promise.all([
    getContracts(orgId),
    getApprovedProposalsWithoutContract(orgId),
  ]);

  return (
    <AppShell active="contracts" eyebrow="COMERCIAL" title="Contratos">
      <ContractsClient
        initialContracts={contracts}
        availableProposals={availableProposals}
        organizationId={orgId}
        userId={session.user.id}
      />
    </AppShell>
  );
}
