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

      <section
        className="proposal-section"
        style={{ paddingBottom: contract.status === "sent" ? 160 : undefined }}
      >
        <p className="eyebrow">DOCUMENTO</p>
        <h1
          style={{
            margin: "12px 0 8px",
            fontSize: "clamp(32px, 4vw, 52px)",
            letterSpacing: "-.045em",
          }}
        >
          {contract.title}
        </h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 32 }}>
          Emitido em{" "}
          {format(new Date(contract.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>

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

        {contract.signedAt && (
          <p style={{ marginTop: 20, color: "var(--success)", fontSize: 13 }}>
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
