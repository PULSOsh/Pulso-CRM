import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, FileSignature } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicContract } from "@/server/actions/contracts";
import SignModal from "./sign-modal";

export default async function PublicContractPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const contract = await getPublicContract(token);

  if (!contract) {
    notFound();
  }

  const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

  const notIncluded = contract.blocks.find((b) => b.stableKey === "not_included");
  const responsibilities = contract.blocks.find((b) => b.stableKey === "responsibilities");
  const payment = contract.paymentPlan;
  const hasStructuredContent = contract.items.length > 0 || !!contract.scope;

  return (
    <div className="public-proposal">
      <header className="proposal-public-header">
        <FileSignature size={22} color="var(--signal)" />
        <nav>
          <span className="mono muted" style={{ fontSize: 10 }}>
            CONTRATO Nº {contract.code}
          </span>
        </nav>
        {contract.status === "signed" ? (
          <span
            style={{
              justifySelf: "end",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 999,
              color: "var(--success)",
              background: "#e4f2e9",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={13} /> Assinado
          </span>
        ) : (
          <span
            style={{
              justifySelf: "end",
              padding: "5px 12px",
              borderRadius: 999,
              color: "var(--signal-dark)",
              background: "var(--signal-soft)",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Aguardando assinatura
          </span>
        )}
      </header>

      <section className="proposal-hero">
        <div>
          <p className="eyebrow">DOCUMENTO</p>
          <h1>{contract.title}</h1>
          <p className="proposal-validity">
            Emitido em{" "}
            {format(new Date(contract.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </section>

      {hasStructuredContent ? (
        <>
          {contract.scope && (
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
                {contract.scope}
              </p>
            </section>
          )}

          {contract.items.length > 0 && (
            <section className="proposal-dark-section">
              <div>
                <p className="eyebrow">02 · ITENS DO CONTRATO</p>
                <h2>O que está sendo contratado</h2>
              </div>
              <ul>
                {contract.items.map((item) => (
                  <li key={item.id}>
                    <CheckCircle2 size={18} />
                    <span>
                      {item.description} ({Number(item.quantity)}× {formatCurrency(item.unitPrice)})
                      — {formatCurrency(item.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {payment && (
            <section className="proposal-section">
              <p className="eyebrow">03 · CONDIÇÃO DE PAGAMENTO</p>
              <h2>Como funciona o investimento</h2>
              {payment.description && (
                <p style={{ maxWidth: 720, marginTop: 16, color: "var(--mineral)", fontSize: 16 }}>
                  {payment.description}
                </p>
              )}
              <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
                {Number(payment.entryAmount) > 0 && (
                  <div className="summary-chip">
                    <strong>{formatCurrency(payment.entryAmount)}</strong>
                    <span>ENTRADA</span>
                  </div>
                )}
                {payment.installmentCount > 0 && (
                  <div className="summary-chip">
                    <strong>
                      {payment.installmentCount}× {formatCurrency(payment.installmentAmount)}
                    </strong>
                    <span>
                      {payment.installmentCount === 1 ? "PARCELA RESTANTE" : "PARCELAS RESTANTES"}
                    </span>
                  </div>
                )}
                <div className="summary-chip">
                  <strong>{formatCurrency(payment.totalAmount)}</strong>
                  <span>TOTAL</span>
                </div>
              </div>
            </section>
          )}

          {responsibilities && (
            <section className="proposal-section">
              <p className="eyebrow">04 · RESPONSABILIDADES</p>
              <h2>{responsibilities.title || "Responsabilidades do contratante"}</h2>
              <ul style={{ display: "grid", gap: 10, marginTop: 20, maxWidth: 720, padding: 0 }}>
                {responsibilities.body
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <li
                      key={line}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        color: "var(--mineral)",
                        fontSize: 15,
                        lineHeight: 1.6,
                        listStyle: "none",
                      }}
                    >
                      <CheckCircle2 size={16} style={{ marginTop: 4, flexShrink: 0 }} />
                      {line}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {notIncluded && (
            <section className="proposal-section">
              <p className="eyebrow">05 · LIMITES DO ESCOPO</p>
              <h2>{notIncluded.title || "O que não está incluso"}</h2>
              <ul style={{ display: "grid", gap: 10, marginTop: 20, maxWidth: 720, padding: 0 }}>
                {notIncluded.body
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <li
                      key={line}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        color: "var(--mineral)",
                        fontSize: 15,
                        lineHeight: 1.6,
                        listStyle: "none",
                      }}
                    >
                      <span style={{ color: "var(--danger)", flexShrink: 0 }}>—</span>
                      {line}
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <section
          className="proposal-section"
          style={{ paddingBottom: contract.status === "sent" ? 160 : undefined }}
        >
          <div
            style={{
              padding: "32px",
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "white",
              whiteSpace: "pre-wrap",
              color: "var(--carbon)",
              fontSize: 14,
              lineHeight: 1.75,
              maxWidth: 780,
            }}
          >
            {contract.content}
          </div>
        </section>
      )}

      <section
        className="proposal-section"
        style={{ paddingBottom: contract.status === "sent" ? 160 : undefined }}
      >
        {contract.signedAt && (
          <p style={{ color: "var(--success)", fontSize: 13 }}>
            Assinado digitalmente em{" "}
            {format(new Date(contract.signedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
            .
          </p>
        )}
      </section>

      {contract.status === "sent" && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            display: "flex",
            justifyContent: "center",
            padding: 24,
            background: "linear-gradient(to top, var(--paper) 55%, transparent)",
          }}
        >
          <SignModal token={token} />
        </div>
      )}

      <footer className="proposal-footer">
        <span>PULSO / Tecnologia para novas possibilidades.</span>
        <span>{contract.code}</span>
      </footer>
    </div>
  );
}
