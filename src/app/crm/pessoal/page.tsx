import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ActivateWorkspacePanel } from "@/components/crm/personal/activate-workspace-panel";
import { PersonalAccountsPanel } from "@/components/crm/personal/personal-accounts-panel";
import { PersonalBankImportPanel } from "@/components/crm/personal/personal-bank-import-panel";
import { PersonalBudgetPanel } from "@/components/crm/personal/personal-budget-panel";
import { PersonalCardsPanel } from "@/components/crm/personal/personal-cards-panel";
import { PersonalGoalsDebtsPanel } from "@/components/crm/personal/personal-goals-debts-panel";
import { PersonalRecurrencesPanel } from "@/components/crm/personal/personal-recurrences-panel";
import { PersonalReportsPanel } from "@/components/crm/personal/personal-reports-panel";
import { PersonalTransactionsPanel } from "@/components/crm/personal/personal-transactions-panel";
import { Tabs } from "@/components/ui/tabs";
import { getPersonalAccounts } from "@/server/actions/personal-accounts";
import { getPersonalBankImports } from "@/server/actions/personal-bank-imports";
import { getPersonalBudgetReport } from "@/server/actions/personal-budgets";
import { getPersonalCategories } from "@/server/actions/personal-categories";
import { getPersonalCreditCards } from "@/server/actions/personal-credit-cards";
import { getPersonalDebts, getPersonalGoals } from "@/server/actions/personal-goals";
import { getPersonalRecurrences } from "@/server/actions/personal-recurrences";
import {
  getPersonalCashFlowReport,
  getPersonalNetWorth,
  getPersonalSpendingByCategory,
  getPersonalUpcomingItems,
} from "@/server/actions/personal-reports";
import { getPersonalTransactions } from "@/server/actions/personal-transactions";
import { getPersonalWorkspace } from "@/server/actions/personal-workspace";
import { auth } from "@/server/auth";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Fora do menu principal, mesmo padrão de confidencialidade de
 * /crm/lucratividade - a barreira real é sempre requirePersonalAccess() no
 * servidor (CRM-F4-01), nunca a ausência de um link na navegação. */
export default async function PersonalFinancePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await getPersonalWorkspace();

  if (!workspace.active) {
    return (
      <AppShell active="personal" eyebrow="CONFIDENCIAL" title="Espaço pessoal">
        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
          <ActivateWorkspacePanel />
        </div>
      </AppShell>
    );
  }

  if (!workspace.isOwner) {
    return (
      <AppShell active="personal" eyebrow="CONFIDENCIAL" title="Espaço pessoal">
        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full text-center py-16">
          <p className="text-sm text-slate-500">Este espaço pessoal pertence a outro usuário.</p>
        </div>
      </AppShell>
    );
  }

  const [
    accounts,
    categories,
    transactions,
    cards,
    recurrences,
    budgetReport,
    goals,
    debts,
    bankImports,
    cashFlow,
    spending,
    netWorth,
    upcoming,
  ] = await Promise.all([
    getPersonalAccounts(),
    getPersonalCategories(),
    getPersonalTransactions(),
    getPersonalCreditCards(),
    getPersonalRecurrences(),
    getPersonalBudgetReport(currentMonth()),
    getPersonalGoals(),
    getPersonalDebts(),
    getPersonalBankImports(),
    getPersonalCashFlowReport(),
    getPersonalSpendingByCategory(),
    getPersonalNetWorth(),
    getPersonalUpcomingItems(),
  ]);

  return (
    <AppShell active="personal" eyebrow="CONFIDENCIAL" title="Espaço pessoal">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <Tabs
          items={[
            {
              id: "transactions",
              label: "Receitas e despesas",
              content: (
                <PersonalTransactionsPanel
                  transactions={transactions}
                  accounts={accounts}
                  categories={categories}
                  cards={cards}
                />
              ),
            },
            {
              id: "accounts",
              label: "Contas",
              content: <PersonalAccountsPanel accounts={accounts} />,
            },
            { id: "cards", label: "Cartões", content: <PersonalCardsPanel cards={cards} /> },
            {
              id: "budget",
              label: "Orçamento",
              content: <PersonalBudgetPanel categories={categories} initialReport={budgetReport} />,
            },
            {
              id: "goals-debts",
              label: "Metas e dívidas",
              content: <PersonalGoalsDebtsPanel goals={goals} debts={debts} />,
            },
            {
              id: "recurrences",
              label: "Recorrências",
              content: <PersonalRecurrencesPanel rules={recurrences} />,
            },
            {
              id: "bank-import",
              label: "Importação bancária",
              content: <PersonalBankImportPanel imports={bankImports} accounts={accounts} />,
            },
            {
              id: "reports",
              label: "Relatórios",
              content: (
                <PersonalReportsPanel
                  cashFlow={cashFlow}
                  spending={spending}
                  netWorth={netWorth}
                  upcoming={upcoming}
                />
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}
