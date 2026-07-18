import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { getDashboardData } from "@/server/actions/dashboard";
import { auth } from "@/server/auth";

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const data = await getDashboardData();

  const metrics = [
    ["Funil aberto", currency(data.pipelineOpenValue), `${data.pipelineOpenCount} oportunidades`],
    [
      "Taxa de conversão",
      data.conversionRate === null ? "—" : `${data.conversionRate.toFixed(1)}%`,
      "últimos 90 dias",
    ],
    ["Recebido no mês", currency(data.receivedThisMonth), "parcelas baixadas"],
    ["Em aberto/vencido", currency(data.pendingTotal), "recebíveis pendentes"],
  ];

  return (
    <AppShell active="dashboard" eyebrow="OPERAÇÃO" title="Visão geral">
      <section className="page">
        <p className="eyebrow">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR }).toUpperCase()}
        </p>
        <h2 style={{ fontSize: 34, letterSpacing: "-.04em", marginTop: 0 }}>
          O que precisa da sua atenção
        </h2>
        <div className="dashboard-metrics">
          {metrics.map(([label, value, note]) => (
            <article key={label} className="metric">
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          ))}
        </div>

        {data.attention.total === 0 ? (
          <p className="mt-8 text-sm text-slate-500">Nada pendente no momento. Bom trabalho.</p>
        ) : (
          <div className="mt-8 space-y-6">
            {data.attention.overdueNextActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Próximas ações vencidas</h3>
                <ul className="space-y-2">
                  {data.attention.overdueNextActions.map((o) => (
                    <li
                      key={o.id}
                      className="bg-white border border-slate-200 rounded-lg p-3 text-sm"
                    >
                      <Link
                        href={`/crm/opportunities/${o.id}`}
                        className="font-medium text-slate-900 hover:text-orange-600"
                      >
                        {o.title}
                      </Link>
                      <p className="text-slate-500">{o.nextActionDescription}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.attention.overdueTasks.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tarefas vencidas</h3>
                <ul className="space-y-2">
                  {data.attention.overdueTasks.map((t) => (
                    <li
                      key={t.id}
                      className="bg-white border border-slate-200 rounded-lg p-3 text-sm"
                    >
                      <Link
                        href="/crm/tarefas"
                        className="font-medium text-slate-900 hover:text-orange-600"
                      >
                        {t.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.attention.overdueInstallments.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Parcelas vencidas</h3>
                <ul className="space-y-2">
                  {data.attention.overdueInstallments.map((i) => (
                    <li
                      key={i.id}
                      className="bg-white border border-slate-200 rounded-lg p-3 text-sm"
                    >
                      <Link
                        href="/crm/financeiro"
                        className="font-medium text-slate-900 hover:text-orange-600"
                      >
                        Parcela {i.installmentNumber} — {currency(Number(i.amount))}
                      </Link>
                      <p className="text-slate-500">
                        Venceu em {new Date(i.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.attention.staleProposals.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Propostas sem follow-up</h3>
                <ul className="space-y-2">
                  {data.attention.staleProposals.map((p) => (
                    <li
                      key={p.id}
                      className="bg-white border border-slate-200 rounded-lg p-3 text-sm"
                    >
                      <Link
                        href={`/crm/quotes/${p.id}`}
                        className="font-medium text-slate-900 hover:text-orange-600"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}
