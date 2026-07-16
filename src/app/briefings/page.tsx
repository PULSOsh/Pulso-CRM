import { BriefingInbox } from "@/components/briefings/briefing-inbox";
import { AppShell } from "@/components/crm/app-shell";

export default function BriefingsPage() {
  return (
    <AppShell active="briefings" eyebrow="CAPTAÇÃO" title="Briefings">
      <section className="page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">CAIXA DE ENTRADA</p>
            <h2>Respostas que já chegam prontas para virar oportunidade.</h2>
          </div>
          <div className="summary-chip">
            <strong>4</strong>
            <span>novas submissões</span>
          </div>
        </div>
        <BriefingInbox />
      </section>
    </AppShell>
  );
}
