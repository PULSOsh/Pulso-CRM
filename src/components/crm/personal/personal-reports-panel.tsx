"use client";

import type {
  getPersonalCashFlowReport,
  getPersonalNetWorth,
  getPersonalSpendingByCategory,
  getPersonalUpcomingItems,
} from "@/server/actions/personal-reports";

type CashFlow = Awaited<ReturnType<typeof getPersonalCashFlowReport>>;
type Spending = Awaited<ReturnType<typeof getPersonalSpendingByCategory>>;
type NetWorth = Awaited<ReturnType<typeof getPersonalNetWorth>>;
type Upcoming = Awaited<ReturnType<typeof getPersonalUpcomingItems>>;

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

function monthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

const UPCOMING_LABELS: Record<string, string> = {
  transaction: "Lançamento previsto",
  recurrence: "Recorrência prevista",
  invoice: "Fatura de cartão",
};

export function PersonalReportsPanel({
  cashFlow,
  spending,
  netWorth,
  upcoming,
}: {
  cashFlow: CashFlow;
  spending: Spending;
  netWorth: NetWorth;
  upcoming: Upcoming;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-medium text-slate-900">Patrimônio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Contas</p>
            <p className="text-xl font-bold text-slate-900">{currency(netWorth.totalAccounts)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Metas</p>
            <p className="text-xl font-bold text-emerald-600">{currency(netWorth.totalGoals)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Dívidas</p>
            <p className="text-xl font-bold text-red-600">{currency(netWorth.totalDebts)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Patrimônio líquido</p>
            <p
              className={`text-xl font-bold ${netWorth.netWorth >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {currency(netWorth.netWorth)}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Saldo das contas calculado a partir dos lançamentos (sem saldo de abertura configurado).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-slate-900">Fluxo de caixa pessoal</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">Mês</th>
                <th className="py-2">Receitas</th>
                <th className="py-2">Despesas</th>
                <th className="py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {cashFlow.map((row) => (
                <tr key={row.month} className="border-t border-slate-100">
                  <td className="py-2 capitalize">{monthLabel(row.month)}</td>
                  <td className="py-2 text-emerald-600">{currency(row.income)}</td>
                  <td className="py-2 text-red-600">{currency(row.expense)}</td>
                  <td
                    className={`py-2 font-medium ${row.net >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {currency(row.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-slate-900">Gastos por categoria (30 dias)</h2>
        {spending.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum gasto no período.</p>
        ) : (
          <ul className="space-y-1">
            {spending.map((row) => (
              <li key={row.category} className="flex justify-between text-sm text-slate-700">
                <span>{row.category}</span>
                <span>{currency(row.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-slate-900">Próximos 60 dias (calendário e alertas)</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">Nada previsto para os próximos 60 dias.</p>
        ) : (
          <ul className="space-y-1">
            {upcoming.map((item) => (
              <li
                key={`${item.kind}-${item.date.toString()}-${item.description}`}
                className="flex items-center justify-between rounded-control border border-pulso-border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.description}</p>
                  <p className="text-xs text-slate-500">
                    {UPCOMING_LABELS[item.kind]} · {new Date(item.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {item.amount !== null && (
                  <span className="text-sm font-semibold text-slate-900">
                    {currency(item.amount)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
