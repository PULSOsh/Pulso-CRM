"use client";

import { Loader2, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GenerateReceivableForm } from "@/components/crm/finance/generate-receivable-form";
import { cancelContract, sendContract } from "@/server/actions/contracts";
import type { getReceivableForContract } from "@/server/actions/finance";

type Contract = {
  id: string;
  code: string;
  title: string;
  status: string;
  content: string;
  publicToken: string;
  signedAt: Date | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  signed: "Assinado",
  cancelled: "Cancelado",
  ended: "Encerrado",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "status-rascunho",
  sent: "status-enviado",
  signed: "status-assinado",
  cancelled: "status-cancelado",
  ended: "status-encerrado",
};

export function ContractDetailsClient({
  contract,
  receivable,
  suggestedTotal,
}: {
  contract: Contract;
  receivable: Awaited<ReturnType<typeof getReceivableForContract>>;
  suggestedTotal: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  async function handleSend() {
    setLoading(true);
    setError(null);
    try {
      await sendContract(contract.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar contrato.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      setError("Informe o motivo do cancelamento.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await cancelContract(contract.id, cancelReason.trim());
      setShowCancelReason(false);
      setCancelReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cancelar contrato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full" style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <strong className="mono" style={{ fontSize: 12, color: "var(--mineral)" }}>
            {contract.code}
          </strong>
          <span className={`status-pill ${STATUS_CLASS[contract.status] ?? "status-rascunho"}`}>
            {STATUS_LABEL[contract.status] ?? contract.status}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {contract.status === "draft" && (
            <button
              type="button"
              className="primary-button"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar para assinatura
            </button>
          )}
          {(contract.status === "draft" || contract.status === "sent") && (
            <button
              type="button"
              className="secondary-button"
              style={{ color: "var(--danger)" }}
              onClick={() => setShowCancelReason((v) => !v)}
              disabled={loading}
            >
              <XCircle size={16} />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {showCancelReason && (
        <div className="builder-card" style={{ display: "grid", gap: 14 }}>
          <label className="field">
            <span>Motivo do cancelamento</span>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Explique por que este contrato está sendo cancelado"
            />
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowCancelReason(false);
                setCancelReason("");
              }}
              disabled={loading}
            >
              Voltar
            </button>
            <button
              type="button"
              className="primary-button"
              style={{ background: "var(--danger)" }}
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Confirmar cancelamento
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}

      {contract.status !== "draft" && (
        <div
          style={{
            padding: 16,
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "white",
          }}
        >
          <p className="muted" style={{ fontSize: 12, margin: "0 0 4px" }}>
            Link público do contrato
          </p>
          <a
            href={`/contrato/${contract.publicToken}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--signal-dark)", wordBreak: "break-all", fontWeight: 650 }}
          >
            /contrato/{contract.publicToken}
          </a>
        </div>
      )}

      {contract.signedAt && (
        <div className="status-assinado" style={{ padding: "12px 16px", borderRadius: 10 }}>
          Assinado em {new Date(contract.signedAt).toLocaleString("pt-BR")}
        </div>
      )}

      <div
        className="builder-card"
        style={{ whiteSpace: "pre-wrap", color: "var(--carbon)", fontSize: 14, lineHeight: 1.65 }}
      >
        {contract.content}
      </div>

      {contract.status === "signed" && (
        <GenerateReceivableForm
          contractId={contract.id}
          existing={receivable}
          suggestedTotal={suggestedTotal}
        />
      )}
    </div>
  );
}
