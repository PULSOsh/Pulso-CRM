import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { FinanceClient } from "@/components/crm/finance/finance-client";
import { getReceivables, refreshOverdueInstallments } from "@/server/actions/finance";
import { auth } from "@/server/auth";

export default async function FinancePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  await refreshOverdueInstallments();
  const receivables = await getReceivables();

  return (
    <AppShell active="finance" eyebrow="OPERAÇÃO" title="Financeiro">
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        <FinanceClient receivables={receivables} />
      </div>
    </AppShell>
  );
}
