"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileSignature, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createContractFromProposal } from "@/server/actions/contracts";

type Contract = {
  id: string;
  code: string;
  title: string;
  status: string;
  createdAt: Date;
};

type AvailableProposal = {
  id: string;
  code: string;
  title: string;
  total: string;
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

export function ContractsClient({
  initialContracts,
  availableProposals,
}: {
  initialContracts: Contract[];
  availableProposals: AvailableProposal[];
}) {
  const [contracts, setContracts] = useState(initialContracts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!selectedProposalId) return;
    setLoading(true);
    setError(null);
    try {
      const contract = await createContractFromProposal(selectedProposalId);
      setContracts([contract, ...contracts]);
      setIsModalOpen(false);
      setSelectedProposalId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar contrato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONTRATOS</p>
          <h2>Gere contratos a partir de propostas aprovadas.</h2>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setIsModalOpen(true)}
          disabled={availableProposals.length === 0}
        >
          <Plus size={16} />
          Gerar contrato
        </button>
      </div>

      {contracts.length === 0 ? (
        <div className="briefing-table" style={{ padding: 48, textAlign: "center" }}>
          <FileSignature size={32} style={{ color: "var(--mineral)", margin: "0 auto 12px" }} />
          <p className="muted">Nenhum contrato gerado ainda.</p>
        </div>
      ) : (
        <div className="briefing-table">
          <div
            className="briefing-row briefing-head"
            style={{ gridTemplateColumns: "0.9fr 1.6fr 0.8fr 0.9fr 42px" }}
          >
            <div>Código</div>
            <div>Título</div>
            <div>Status</div>
            <div>Data</div>
            <div />
          </div>
          {contracts.map((contract) => (
            <div
              className="briefing-row"
              key={contract.id}
              style={{ gridTemplateColumns: "0.9fr 1.6fr 0.8fr 0.9fr 42px" }}
            >
              <div>
                <strong className="mono" style={{ fontSize: 11 }}>
                  {contract.code}
                </strong>
              </div>
              <div>
                <strong>{contract.title}</strong>
              </div>
              <div>
                <span
                  className={`status-pill ${STATUS_CLASS[contract.status] ?? "status-rascunho"}`}
                >
                  {STATUS_LABEL[contract.status] ?? contract.status}
                </span>
              </div>
              <div>
                <strong className="mono" style={{ fontSize: 11 }}>
                  {format(contract.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                </strong>
              </div>
              <Link
                href={`/crm/contratos/${contract.id}`}
                className="icon-button"
                aria-label={`Ver contrato ${contract.code}`}
                style={{ textDecoration: "none", color: "var(--signal)" }}
              >
                →
              </Link>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "rgb(22 22 22 / .45)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            style={{
              width: "min(100%, 460px)",
              padding: 28,
              borderRadius: 16,
              background: "var(--paper)",
              boxShadow: "0 30px 90px rgb(0 0 0 / .2)",
            }}
          >
            <h3 style={{ margin: "0 0 6px", fontSize: 26, letterSpacing: "-.03em" }}>
              Gerar contrato
            </h3>
            <p className="muted" style={{ margin: "0 0 24px" }}>
              Selecione uma proposta aprovada para gerar o contrato.
            </p>

            <div style={{ display: "grid", gap: 18 }}>
              <label className="field">
                <span>Proposta aprovada</span>
                <select
                  value={selectedProposalId}
                  onChange={(e) => setSelectedProposalId(e.target.value)}
                >
                  <option value="">Selecione uma proposta aprovada...</option>
                  {availableProposals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title} (R$ {p.total})
                    </option>
                  ))}
                </select>
              </label>

              {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  paddingTop: 8,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  style={{ flex: 1 }}
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="primary-button"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                  onClick={handleGenerate}
                  disabled={loading || !selectedProposalId}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? "Gerando..." : "Gerar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
