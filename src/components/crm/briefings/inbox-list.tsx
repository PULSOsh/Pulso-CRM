"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

type Submission = {
  id: string;
  protocol: string;
  status: string;
  contactName: string | null;
  companyName: string | null;
  createdAt: Date;
  template: {
    name: string;
    publicTitle: string;
  } | null;
};

const STATUS_LABEL: Record<string, string> = {
  started: "Novo",
  submitted: "Novo",
  under_review: "Em análise",
  linked: "Convertido",
};

const STATUS_CLASS: Record<string, string> = {
  started: "status-novo",
  submitted: "status-novo",
  under_review: "status-em-análise",
  linked: "status-qualificado",
};

export function InboxList({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <div className="briefing-table" style={{ padding: 48, textAlign: "center" }}>
        <p className="muted">Nenhum briefing recebido ainda.</p>
      </div>
    );
  }

  return (
    <div className="briefing-table">
      <div className="briefing-row briefing-head">
        <div>Contato</div>
        <div>Serviço</div>
        <div>Status</div>
        <div>Enviado</div>
        <div>Protocolo</div>
        <div />
      </div>
      {submissions.map((sub) => (
        <div className="briefing-row" key={sub.id}>
          <div>
            <strong>{sub.contactName || "Sem nome"}</strong>
            <small>{sub.companyName || "Empresa não informada"}</small>
          </div>
          <div>
            <strong>{sub.template?.publicTitle || sub.template?.name || "Desconhecido"}</strong>
          </div>
          <div>
            <span className={`status-pill ${STATUS_CLASS[sub.status] ?? "status-novo"}`}>
              {STATUS_LABEL[sub.status] ?? sub.status}
            </span>
          </div>
          <div>
            <strong className="mono" style={{ fontSize: 11 }}>
              {format(sub.createdAt, "dd/MM/yyyy", { locale: ptBR })}
            </strong>
            <small>{format(sub.createdAt, "HH:mm", { locale: ptBR })}</small>
          </div>
          <div>
            <small className="mono">{sub.protocol}</small>
          </div>
          <Link
            href={`/crm/briefings/inbox/${sub.id}`}
            className="icon-button"
            aria-label={`Ver briefing de ${sub.contactName ?? sub.protocol}`}
            style={{ textDecoration: "none", color: "var(--signal)" }}
          >
            →
          </Link>
        </div>
      ))}
    </div>
  );
}
