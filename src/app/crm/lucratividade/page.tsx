import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ProfitabilityClient } from "@/components/crm/profitability/profitability-client";
import {
  getBusinessProfitability,
  getFinancialSettings,
  getPersonalProfitability,
} from "@/server/actions/profitability";
import { auth } from "@/server/auth";

const DAYS = 30;

export default async function ProfitabilityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [business, settings] = await Promise.all([
    getBusinessProfitability(DAYS),
    getFinancialSettings(),
  ]);

  // profitability.read_personal só existe no papel owner
  // (docs/MODULE_SPECIFICATIONS.md §13 - "acesso exclusivo do fundador").
  // requirePermission lança erro para quem não tem a permissão; aqui isso
  // significa só esconder o bloco pessoal, não negar a página inteira,
  // já que o bloco empresarial é visível para mais papéis (finance/admin/owner).
  let personal: Awaited<ReturnType<typeof getPersonalProfitability>> | null = null;
  try {
    personal = await getPersonalProfitability(DAYS);
  } catch {
    personal = null;
  }

  return (
    <AppShell active="profitability" eyebrow="CONFIDENCIAL" title="Custos e lucratividade">
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        <ProfitabilityClient business={business} personal={personal} settings={settings} />
      </div>
    </AppShell>
  );
}
