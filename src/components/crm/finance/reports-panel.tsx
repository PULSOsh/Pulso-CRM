"use client";

import type {
  getCashFlowReport,
  getDelinquencyReport,
  getDreReport,
} from "@/server/actions/reports";

type CashFlow = Awaited<ReturnType<typeof getCashFlowReport>>;
type Dre = Awaited<ReturnType<typeof getDreReport>>;
type Delinquency = Awaited<ReturnType<typeof getDelinquencyReport>>;

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

export function ReportsPanel({
  cashFlow,
  dre,
  delinquency,
}: {
  cashFlow: CashFlow;
  dre: Dre;
  delinquency: Delinquency;
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-medium text-slate-900">Fluxo de caixa projetado</h2>
        <p className="text-sm text-slate-500">
          Saldo atual (razão):{" "}
          <strong className="text-slate-900">{currency(cashFlow.currentBalance)}</strong>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">Mês</th>
                <th className="py-2">Entradas previstas</th>
                <th className="py-2">Saídas previstas</th>
                <th className="py-2">Saldo projetado</th>
              </tr>
            </thead>
            <tbody>
              {cashFlow.byMonth.map((row) => (
                <tr key={row.month} className="border-t border-slate-100">
                  <td className="py-2 capitalize">{monthLabel(row.month)}</td>
                  <td className="py-2 text-emerald-600">{currency(row.inflow)}</td>
                  <td className="py-2 text-red-600">{currency(row.outflow)}</td>
                  <td className="py-2 font-medium text-slate-900">
                    {currency(row.projectedBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-slate-900">DRE gerencial (regime de caixa)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Receita</p>
            <p className="text-xl font-bold text-emerald-600">{currency(dre.revenue)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Despesas</p>
            <p className="text-xl font-bold text-red-600">{currency(dre.totalExpenses)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Resultado</p>
            <p
              className={`text-xl font-bold ${dre.result >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {currency(dre.result)}
            </p>
          </div>
        </div>
        {dre.expensesByCategory.length > 0 && (
          <ul className="space-y-1">
            {dre.expensesByCategory.map((row) => (
              <li key={row.category} className="flex justify-between text-sm text-slate-700">
                <span>{row.category}</span>
                <span>{currency(row.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-slate-900">Inadimplência</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Total vencido</p>
            <p className="text-xl font-bold text-red-600">{currency(delinquency.totalOverdue)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-500">Taxa de inadimplência</p>
            <p className="text-xl font-bold text-slate-900">
              {(delinquency.delinquencyRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(delinquency.aging).map(([bucket, total]) => (
            <div
              key={bucket}
              className="bg-white border border-slate-200 rounded-xl p-3 text-center"
            >
              <p className="text-xs text-slate-500">{bucket} dias</p>
              <p className="text-sm font-semibold text-slate-900">{currency(total)}</p>
            </div>
          ))}
        </div>
        {delinquency.byCompany.length > 0 && (
          <ul className="space-y-1">
            {delinquency.byCompany.map((row) => (
              <li key={row.companyName} className="flex justify-between text-sm text-slate-700">
                <span>
                  {row.companyName} ({row.count})
                </span>
                <span>{currency(row.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
