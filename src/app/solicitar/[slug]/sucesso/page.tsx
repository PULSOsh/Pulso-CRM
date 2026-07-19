import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function BriefingSuccessPage({
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ protocolo?: string }>;
}) {
  const { protocolo } = await searchParams;
  const protocol = protocolo || `PULSO-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="public-success">
      <div className="success-mark">
        <CheckCircle2 size={30} />
      </div>
      <p className="eyebrow">BRIEFING ENVIADO</p>
      <h1>Recebemos suas respostas.</h1>
      <p>
        Nossa equipe já foi notificada e entrará em contato em breve para dar sequência ao seu
        projeto.
      </p>
      <div
        style={{
          padding: "16px 20px",
          marginTop: 8,
          border: "1px solid var(--border)",
          borderRadius: 10,
          background: "white",
        }}
      >
        <p className="muted" style={{ margin: "0 0 4px", fontSize: 12 }}>
          Número do protocolo
        </p>
        <p className="mono" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          {protocol}
        </p>
      </div>
      <Link href="/" className="primary-button" style={{ display: "inline-flex", marginTop: 8 }}>
        Voltar para o site principal
      </Link>
    </div>
  );
}
