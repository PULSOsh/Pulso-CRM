import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import {
  getCommercialReport,
  getFinancialReport,
  getOperationalReport,
} from "@/server/actions/reports";
import { auth } from "@/server/auth";

const PERIODS = [
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
  { days: 365, label: "12 meses" },
];

const PROJECT_STATUS_LABELS: Record<string, string> = {
  planned: "Planejado",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { days: daysParam } = await searchParams;
  const days = PERIODS.some((p) => p.days === Number(daysParam)) ? Number(daysParam) : 90;

  const [commercial, operational, financial] = await Promise.all([
    getCommercialReport(days),
    getOperationalReport(),
    getFinancialReport(days),
  ]);

  return (
    <AppShell active="reports" eyebrow="OPERAÇÃO" title="Relatórios">
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p.days}
              href={`/crm/relatorios?days=${p.days}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                p.days === days
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Comercial</h2>
          <p className="text-sm text-slate-500 mb-4">
            Ticket médio (ganhas no período): <strong>{currency(commercial.avgTicket)}</strong>
          </p>

          <h3 className="text-sm font-semibold text-slate-700 mb-2">Leads por mês</h3>
          <table className="w-full text-left text-sm mb-6">
            <thead className="text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-1">Mês</th>
                <th className="py-1 text-right">Oportunidades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commercial.leadsByMonth.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-3 text-slate-400">
                    Sem dados no período.
                  </td>
                </tr>
              ) : (
                commercial.leadsByMonth.map((row) => (
                  <tr key={row.month}>
                    <td className="py-1">{row.month}</td>
                    <td className="py-1 text-right">{row.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <h3 className="text-sm font-semibold text-slate-700 mb-2">Conversão por origem</h3>
          <table className="w-full text-left text-sm mb-6">
            <thead className="text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-1">Origem</th>
                <th className="py-1 text-right">Total</th>
                <th className="py-1 text-right">Ganhas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commercial.byOrigin.map((row) => (
                <tr key={row.origin}>
                  <td className="py-1">{row.origin}</td>
                  <td className="py-1 text-right">{row.total}</td>
                  <td className="py-1 text-right">{row.won}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-sm font-semibold text-slate-700 mb-2">Ganho/perda por responsável</h3>
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-1">Responsável</th>
                <th className="py-1 text-right">Ganhas</th>
                <th className="py-1 text-right">Perdidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commercial.byOwner.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 text-slate-400">
                    Sem oportunidades decididas no período.
                  </td>
                </tr>
              ) : (
                commercial.byOwner.map((row) => (
                  <tr key={row.ownerName}>
                    <td className="py-1">{row.ownerName}</td>
                    <td className="py-1 text-right">{row.won}</td>
                    <td className="py-1 text-right">{row.lost}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Operacional</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Tarefas atrasadas</p>
              <p className="text-2xl font-bold text-red-600">{operational.overdueTasks}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Aprovações pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{operational.pendingApprovals}</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-2">Projetos por status</h3>
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-1">Status</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {operational.projectsByStatus.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-3 text-slate-400">
                    Nenhum projeto ainda.
                  </td>
                </tr>
              ) : (
                operational.projectsByStatus.map((row) => (
                  <tr key={row.status}>
                    <td className="py-1">{PROJECT_STATUS_LABELS[row.status] ?? row.status}</td>
                    <td className="py-1 text-right">{row.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Financeiro</h2>
          <p className="text-sm text-slate-500 mb-4">
            {financial.totalReceivables} recebíveis gerados, total {currency(financial.totalAmount)}
          </p>
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-1">Mês (vencimento)</th>
                <th className="py-1 text-right">Recebido</th>
                <th className="py-1 text-right">Pendente</th>
                <th className="py-1 text-right">Vencido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financial.byMonth.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-slate-400">
                    Sem parcelas no período.
                  </td>
                </tr>
              ) : (
                financial.byMonth.map((row) => (
                  <tr key={row.month}>
                    <td className="py-1">{row.month}</td>
                    <td className="py-1 text-right text-emerald-700">
                      {currency(Number(row.received))}
                    </td>
                    <td className="py-1 text-right text-slate-600">
                      {currency(Number(row.pending))}
                    </td>
                    <td className="py-1 text-right text-red-600">
                      {currency(Number(row.overdue))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
