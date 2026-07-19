import { FileText } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { InboxList } from "@/components/crm/briefings/inbox-list";
import { getBriefingSubmissions } from "@/server/actions/briefing-submissions";
import { auth } from "@/server/auth";

export default async function InboxPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const submissions = await getBriefingSubmissions();
  const newCount = submissions.filter((s) => ["started", "submitted"].includes(s.status)).length;

  return (
    <AppShell active="briefings" eyebrow="CAPTAÇÃO" title="Briefings">
      <div className="p-4 md:p-8">
        <div className="page-heading">
          <div>
            <p className="eyebrow">CAIXA DE ENTRADA</p>
            <h2>Respostas que já chegam prontas para virar oportunidade.</h2>
          </div>
          <div className="summary-chip">
            <strong>{newCount}</strong>
            <span>NOVAS SUBMISSÕES</span>
          </div>
        </div>

        <div className="briefing-page-grid">
          <InboxList submissions={submissions} />

          <aside className="briefing-aside">
            <p className="eyebrow">FLUXO RECOMENDADO</p>
            <h2>Da resposta ao orçamento</h2>
            <ul className="process-list">
              <li>
                <span>1</span>
                <div>
                  <strong>Revisar respostas</strong>
                  <small>Confirme dados, contexto e anexos.</small>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>Vincular ao CRM</strong>
                  <small>Crie ou associe contato, empresa e oportunidade.</small>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>Gerar orçamento</strong>
                  <small>Importe o briefing e revise o escopo.</small>
                </div>
              </li>
              <li>
                <span>4</span>
                <div>
                  <strong>Publicar em site</strong>
                  <small>Envie um link com aceite e histórico.</small>
                </div>
              </li>
            </ul>
            <Link
              href="/crm/quotes/new"
              className="primary-button full-button"
              style={{ textDecoration: "none" }}
            >
              <FileText size={16} />
              Criar orçamento
            </Link>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
