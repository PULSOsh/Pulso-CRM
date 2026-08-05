import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { AccountsPanel } from "@/components/crm/finance/accounts-panel";
import { BankImportPanel } from "@/components/crm/finance/bank-import-panel";
import { CategoriesPanel } from "@/components/crm/finance/categories-panel";
import { FinanceClient } from "@/components/crm/finance/finance-client";
import { PayablesPanel } from "@/components/crm/finance/payables-panel";
import { RecurrencesPanel } from "@/components/crm/finance/recurrences-panel";
import { ReportsPanel } from "@/components/crm/finance/reports-panel";
import { Tabs } from "@/components/ui/tabs";
import { getBankImports } from "@/server/actions/bank-imports";
import { getCompanies } from "@/server/actions/companies";
import { getCostCenters } from "@/server/actions/cost-centers";
import { getReceivables, refreshOverdueInstallments } from "@/server/actions/finance";
import { getFinancialAccounts } from "@/server/actions/financial-accounts";
import { getFinancialRecurrences } from "@/server/actions/financial-recurrences";
import { getPayables, refreshOverduePayableInstallments } from "@/server/actions/payables";
import { getExpenseCategories } from "@/server/actions/profitability";
import { getCashFlowReport, getDelinquencyReport, getDreReport } from "@/server/actions/reports";
import { getVendors } from "@/server/actions/vendors";
import { auth } from "@/server/auth";

export default async function FinancePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  await Promise.all([refreshOverdueInstallments(), refreshOverduePayableInstallments()]);

  const [
    receivables,
    payables,
    accounts,
    costCenters,
    categories,
    vendors,
    companies,
    recurrences,
    bankImports,
    cashFlow,
    dre,
    delinquency,
  ] = await Promise.all([
    getReceivables(),
    getPayables(),
    getFinancialAccounts(),
    getCostCenters(),
    getExpenseCategories(),
    getVendors(),
    getCompanies(),
    getFinancialRecurrences(),
    getBankImports(),
    getCashFlowReport(),
    getDreReport(90),
    getDelinquencyReport(),
  ]);

  return (
    <AppShell active="finance" eyebrow="OPERAÇÃO" title="Financeiro">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <Tabs
          items={[
            {
              id: "receivables",
              label: "Recebíveis",
              content: <FinanceClient receivables={receivables} />,
            },
            {
              id: "payables",
              label: "Contas a pagar",
              content: (
                <PayablesPanel
                  payables={payables}
                  vendors={vendors}
                  categories={categories}
                  costCenters={costCenters}
                  accounts={accounts}
                />
              ),
            },
            {
              id: "accounts",
              label: "Contas e transferências",
              content: <AccountsPanel accounts={accounts} />,
            },
            {
              id: "categories",
              label: "Categorias e fornecedores",
              content: (
                <CategoriesPanel
                  costCenters={costCenters}
                  categories={categories}
                  vendors={vendors}
                  companies={companies}
                />
              ),
            },
            {
              id: "recurrences",
              label: "Recorrências",
              content: <RecurrencesPanel rules={recurrences} />,
            },
            {
              id: "bank-import",
              label: "Importação bancária",
              content: <BankImportPanel imports={bankImports} accounts={accounts} />,
            },
            {
              id: "reports",
              label: "Relatórios",
              content: <ReportsPanel cashFlow={cashFlow} dre={dre} delinquency={delinquency} />,
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
