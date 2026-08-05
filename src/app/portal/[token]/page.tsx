import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Circle, FileText, LayoutDashboard } from "lucide-react";
import { notFound } from "next/navigation";
import { getClientPortalProject } from "@/server/actions/client-portal";
import { getClientPortalTickets } from "@/server/actions/tickets";
import SatisfactionForm from "./satisfaction-form";
import TicketForm from "./ticket-form";

const STATUS_LABELS: Record<string, string> = {
  planned: "Planejado",
  active: "Em andamento",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando decisão",
  approved: "Aprovada",
  approved_with_notes: "Aprovada com observações",
  rejected: "Ajuste solicitado",
  expired: "Expirada",
  cancelled: "Cancelada",
};

const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  waiting_customer: "Aguardando você",
  resolved: "Resolvido",
  closed: "Encerrado",
};

export default async function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [project, tickets] = await Promise.all([
    getClientPortalProject(token),
    getClientPortalTickets(token),
  ]);

  if (!project) {
    notFound();
  }

  const needsSatisfaction = Boolean(
    project.satisfactionRequestedAt && !project.satisfactionRespondedAt,
  );

  return (
    <div className="public-proposal">
      <header className="proposal-public-header">
        <LayoutDashboard size={22} color="var(--signal)" />
        <nav>
          <span className="mono muted" style={{ fontSize: 10 }}>
            PORTAL DO CLIENTE
          </span>
        </nav>
        <span />
      </header>

      <section className="proposal-hero">
        <div>
          <p className="eyebrow">PROJETO</p>
          <h1>{project.name}</h1>
          <p className="proposal-validity">
            Status: {STATUS_LABELS[project.status] ?? project.status}
          </p>
        </div>
      </section>

      {project.description && (
        <section className="proposal-section">
          <p className="eyebrow">01 · SOBRE O PROJETO</p>
          <p
            style={{
              maxWidth: 720,
              marginTop: 16,
              color: "var(--mineral)",
              fontSize: 16,
              lineHeight: 1.75,
            }}
          >
            {project.description}
          </p>
        </section>
      )}

      <section className="proposal-dark-section">
        <div>
          <p className="eyebrow eyebrow-light">02 · MARCOS</p>
          <h2>Andamento da entrega</h2>
        </div>
        <ul>
          {project.milestones.map((m) => (
            <li key={m.id}>
              {m.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              <span>
                {m.title}
                {m.dueDate && ` — ${format(new Date(m.dueDate), "dd/MM/yyyy", { locale: ptBR })}`}
              </span>
            </li>
          ))}
          {project.milestones.length === 0 && <li>Nenhum marco cadastrado ainda.</li>}
        </ul>
      </section>

      {project.approvals.length > 0 && (
        <section className="proposal-section">
          <p className="eyebrow">03 · APROVAÇÕES</p>
          <ul style={{ marginTop: 16 }}>
            {project.approvals.map((a) => (
              <li key={a.id} style={{ marginBottom: 8 }}>
                {a.title} — <strong>{APPROVAL_STATUS_LABELS[a.status] ?? a.status}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.files.length > 0 && (
        <section className="proposal-section">
          <p className="eyebrow">04 · ARQUIVOS</p>
          <ul style={{ marginTop: 16 }}>
            {project.files.map((f) => (
              <li
                key={f.url}
                style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
              >
                <FileText size={16} />
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {f.label || f.originalName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="proposal-section">
        <p className="eyebrow">05 · CHAMADOS</p>
        <ul style={{ marginTop: 16, marginBottom: 16 }}>
          {tickets.map((t) => (
            <li key={t.id} style={{ marginBottom: 8 }}>
              {t.subject} — <strong>{TICKET_STATUS_LABELS[t.status] ?? t.status}</strong>
            </li>
          ))}
          {tickets.length === 0 && <li>Nenhum chamado aberto ainda.</li>}
        </ul>
        <TicketForm token={token} />
      </section>

      {needsSatisfaction && (
        <section className="proposal-section">
          <p className="eyebrow">AVALIAÇÃO</p>
          <h2>Como foi sua experiência com este projeto?</h2>
          <div style={{ marginTop: 16, maxWidth: 480 }}>
            <SatisfactionForm token={token} />
          </div>
        </section>
      )}

      {project.satisfactionRespondedAt && (
        <section className="proposal-section">
          <p className="eyebrow">AVALIAÇÃO</p>
          <p style={{ marginTop: 16 }}>Obrigado pela sua avaliação!</p>
        </section>
      )}
    </div>
  );
}
