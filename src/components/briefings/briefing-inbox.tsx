import { ArrowUpRight, FileText, Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { briefings } from "@/data/briefings";

export function BriefingInbox() {
  return (
    <div className="briefing-page-grid">
      <section>
        <div className="toolbar">
          <div className="toolbar-group">
            <button className="secondary-button" type="button">
              <Filter aria-hidden="true" /> Todos os status
            </button>
            <label className="inline-search">
              <Search aria-hidden="true" />
              <input placeholder="Buscar briefing..." />
            </label>
          </div>
          <div className="toolbar-group">
            <Link href="/solicitar/site-essencial" className="secondary-button link-button">
              Abrir formulário público
            </Link>
            <button className="primary-button" type="button">
              <Plus aria-hidden="true" /> Novo template
            </button>
          </div>
        </div>

        <div className="briefing-table">
          <div className="briefing-row briefing-head">
            <span>Cliente</span>
            <span>Serviço</span>
            <span>Status</span>
            <span>Enviado</span>
            <span>Completude</span>
            <span>Ações</span>
          </div>
          {briefings.map((briefing) => (
            <article className="briefing-row" key={briefing.id}>
              <div>
                <strong>{briefing.name}</strong>
                <small>
                  {briefing.company} · {briefing.protocol}
                </small>
              </div>
              <div>
                <strong>{briefing.service}</strong>
                <small>{briefing.budget}</small>
              </div>
              <span
                className={`status-pill status-${briefing.status.toLowerCase().replaceAll(" ", "-")}`}
              >
                {briefing.status}
              </span>
              <div>
                <strong>{briefing.submittedAt}</strong>
                <small>{briefing.source}</small>
              </div>
              <div>
                <div className="progress-track">
                  <span style={{ width: `${briefing.completeness}%` }} />
                </div>
                <small>{briefing.completeness}% respondido</small>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label={`Abrir briefing de ${briefing.name}`}
              >
                <ArrowUpRight aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </section>

      <aside className="briefing-aside">
        <p className="eyebrow">FLUXO RECOMENDADO</p>
        <h2>Da resposta ao orçamento</h2>
        <ol className="process-list">
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
        </ol>
        <Link href="/orcamentos/novo" className="primary-button link-button full-button">
          <FileText aria-hidden="true" /> Criar orçamento
        </Link>
      </aside>
    </div>
  );
}
