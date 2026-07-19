import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicProposal } from "@/server/actions/public-quote";
import ApproveModal from "./approve-modal";

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proposal = await getPublicProposal(token);

  if (!proposal) {
    notFound();
  }

  const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

  const isDecided = !["draft", "sent", "viewed"].includes(proposal.status);

  return (
    <div className="public-proposal">
      <header className="proposal-public-header">
        <FileText size={22} color="var(--signal)" />
        <nav>
          <a href="#escopo">Escopo</a>
          <a href="#investimento">Investimento</a>
        </nav>
        <span />
      </header>

      <section className="proposal-hero">
        <div>
          <p className="eyebrow">
            PROPOSTA COMERCIAL · {format(new Date(proposal.createdAt), "MM/yyyy")} · {proposal.code}
          </p>
          <h1>{proposal.title}</h1>
          {proposal.validUntil && (
            <p className="proposal-validity">
              <Clock size={17} />
              Válida até{" "}
              {format(new Date(proposal.validUntil), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        {(proposal.preparedForName || proposal.preparedForContact) && (
          <aside>
            <span>PREPARADA PARA</span>
            {proposal.preparedForName && <strong>{proposal.preparedForName}</strong>}
            {proposal.preparedForContact && <small>{proposal.preparedForContact}</small>}
          </aside>
        )}
      </section>

      {proposal.version.scope && (
        <section className="proposal-section" id="escopo">
          <p className="eyebrow">01 · ESCOPO</p>
          <h2>O que está incluso</h2>
          <p
            style={{
              maxWidth: 720,
              marginTop: 16,
              color: "var(--mineral)",
              fontSize: 16,
              lineHeight: 1.75,
            }}
          >
            {proposal.version.scope}
          </p>
        </section>
      )}

      <section className="proposal-dark-section">
        <div>
          <p className="eyebrow eyebrow-light">02 · INVESTIMENTO DETALHADO</p>
          <h2>Itens desta proposta</h2>
          {proposal.version.terms && <p>{proposal.version.terms}</p>}
        </div>
        <ul>
          {proposal.items.map((item) => (
            <li key={item.id}>
              <CheckCircle2 size={18} />
              <span>
                {item.description} ({Number(item.quantity)}× {formatCurrency(item.unitPrice)}) —{" "}
                {formatCurrency(item.total)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {proposal.files.length > 0 && (
        <section className="proposal-section">
          <p className="eyebrow">03 · ARQUIVOS</p>
          <h2>Anexos</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 20, maxWidth: 620 }}>
            {proposal.files.map((file) => (
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

      <section className="investment-section" id="investimento">
        <div>
          <p className="eyebrow">INVESTIMENTO TOTAL</p>
          <h2>{formatCurrency(proposal.total)}</h2>
          {Number(proposal.discount) > 0 && (
            <p>Inclui {formatCurrency(proposal.discount)} em descontos</p>
          )}
        </div>
        {isDecided ? (
          <div className="investment-actions">
            <p style={{ color: "white", fontWeight: 800, fontSize: 18 }}>
              {proposal.status === "approved" ? "Proposta aceita ✓" : `Status: ${proposal.status}`}
            </p>
          </div>
        ) : (
          <ApproveModal token={token} />
        )}
      </section>

      <footer className="proposal-footer">
        <span>PULSO / Tecnologia para novas possibilidades.</span>
        <span>{proposal.code}</span>
      </footer>
    </div>
  );
}
