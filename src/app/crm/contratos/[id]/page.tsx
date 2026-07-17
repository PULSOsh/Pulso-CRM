import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ContractDetailsClient } from "@/components/crm/contract-details-client";
import { getContractById } from "@/server/actions/contracts";
import { auth } from "@/server/auth";

export default async function ContractDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const contract = await getContractById(params.id);

  if (!contract) {
    notFound();
  }

  return (
    <AppShell active="contracts" eyebrow="COMERCIAL" title={contract.title}>
      <ContractDetailsClient contract={contract} />
    </AppShell>
  );
}
