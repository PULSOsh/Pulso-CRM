import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ContractDetailsClient } from "@/components/crm/contract-details-client";
import { getContractById } from "@/server/actions/contracts";
import { getReceivableForContract } from "@/server/actions/finance";
import { auth } from "@/server/auth";
import { db } from "@/server/db/connection";
import { proposals } from "@/server/db/schema";

export default async function ContractDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const contract = await getContractById(id);

  if (!contract) {
    notFound();
  }

  const receivable = contract.status === "signed" ? await getReceivableForContract(id) : null;
  const proposal = contract.proposalId
    ? await db.query.proposals.findFirst({
        where: eq(proposals.id, contract.proposalId),
        columns: { total: true },
      })
    : null;

  return (
    <AppShell active="contracts" eyebrow="COMERCIAL" title={contract.title}>
      <ContractDetailsClient
        contract={contract}
        receivable={receivable}
        suggestedTotal={proposal ? Number(proposal.total) : null}
      />
    </AppShell>
  );
}
