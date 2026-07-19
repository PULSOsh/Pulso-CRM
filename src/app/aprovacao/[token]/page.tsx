import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, ClipboardCheck, MessageSquareWarning, XCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicApproval } from "@/server/actions/public-approval";
import DecideModal from "./decide-modal";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Aguardando decisão", color: "var(--signal-dark)", bg: "var(--signal-soft)" },
  approved: { label: "Aprovada", color: "var(--success)", bg: "#e4f2e9" },
  approved_with_notes: {
    label: "Aprovada com observações",
    color: "var(--success)",
    bg: "#e4f2e9",
  },
  rejected: { label: "Ajuste solicitado", color: "var(--danger)", bg: "#f8dddd" },
  expired: { label: "Expirada", color: "var(--mineral)", bg: "var(--paper-2, #ece9e2)" },
  cancelled: { label: "Cancelada", color: "var(--mineral)", bg: "var(--paper-2, #ece9e2)" },
};

export default async function PublicApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const approval = await getPublicApproval(token);

  if (!approval) {
    notFound();
  }

  const badge = STATUS_BADGE[approval.status] ?? STATUS_BADGE.pending;

  return (
    <div className="public-proposal">
      <header className="proposal-public-header">
        <ClipboardCheck size={22} color="var(--signal)" />
        <nav>
          {approval.projectName && (
            <span className="mono muted" style={{ fontSize: 10 }}>
              {approval.projectName.toUpperCase()}
            </span>
          )}
        </nav>
        <span
          style={{
            justifySelf: "end",
            padding: "5px 12px",
            borderRadius: 999,
            color: badge.color,
            background: badge.bg,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {badge.label}
        </span>
      </header>

      <section
        className="proposal-hero"
        style={{ gridTemplateColumns: "1fr", minHeight: "auto", paddingBottom: "4vw" }}
      >
        <div>
          <p className="eyebrow">SOLICITAÇÃO DE APROVAÇÃO</p>
          <h1 style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>{approval.title}</h1>
          <p className="muted" style={{ fontSize: 13 }}>
            Solicitado em{" "}
            {format(new Date(approval.requestedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </section>

      {approval.description && (
        <section className="proposal-section" style={{ paddingTop: 0 }}>
          <p
            style={{
              maxWidth: 720,
              color: "var(--carbon)",
              fontSize: 16,
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
            }}
          >
            {approval.description}
          </p>
        </section>
      )}

      {approval.files.length > 0 && (
        <section className="proposal-section" style={{ paddingTop: 0 }}>
          <p className="eyebrow">ARQUIVOS</p>
          <div style={{ display: "grid", gap: 10, marginTop: 16, maxWidth: 620 }}>
            {approval.files.map((file) => (
              <a
                key={file.url}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "white",
                  color: "var(--carbon)",
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                <span>{file.label || file.originalName}</span>
                <span style={{ color: "var(--signal)" }}>Baixar →</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="proposal-section" style={{ paddingTop: 0 }}>
        {approval.status === "pending" ? (
          <DecideModal token={token} />
        ) : (
          <div
            style={{
              display: "grid",
              gap: 10,
              maxWidth: 480,
              padding: 24,
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {approval.status === "rejected" ? (
                <XCircle color="var(--danger)" size={20} />
              ) : (
                <CheckCircle2 color="var(--success)" size={20} />
              )}
              <strong>{badge.label}</strong>
            </div>
            {approval.decisionNotes && (
              <p className="muted" style={{ display: "flex", gap: 8, fontSize: 13, margin: 0 }}>
                <MessageSquareWarning size={16} />
                {approval.decisionNotes}
              </p>
            )}
            {approval.decidedAt && (
              <p className="muted" style={{ fontSize: 11, margin: 0 }}>
                Decidido em{" "}
                {format(new Date(approval.decidedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
        )}
      </section>

      <footer className="proposal-footer">
        <span>PULSO / Tecnologia para novas possibilidades.</span>
      </footer>
    </div>
  );
}
