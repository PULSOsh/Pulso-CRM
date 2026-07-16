import { AppShell } from "@/components/crm/app-shell";

const metrics = [
  ["Funil aberto", "R$ 34.900", "12 oportunidades"],
  ["Previsão do mês", "R$ 12.450", "+18% sobre junho"],
  ["Taxa de conversão", "31,4%", "últimos 90 dias"],
  ["Recebimentos", "R$ 7.180", "R$ 2.500 pendentes"],
];

export default function DashboardPage() {
  return (
    <AppShell active="dashboard" eyebrow="OPERAÇÃO" title="Visão geral">
      <section className="page">
        <p className="eyebrow">QUINTA-FEIRA, 16 DE JULHO</p>
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
      </section>
    </AppShell>
  );
}
