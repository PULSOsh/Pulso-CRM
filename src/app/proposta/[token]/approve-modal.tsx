"use client";

import { CheckCircle2, Loader2, PenTool } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveProposal } from "@/server/actions/public-quote";

type OptionalItem = { id: string; description: string; total: number };

export default function ApproveModal({
  token,
  baseTotal,
  optionalItems,
}: {
  token: string;
  baseTotal: number;
  optionalItems: OptionalItem[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedOptionalIds, setSelectedOptionalIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const selectedTotal =
    baseTotal +
    optionalItems
      .filter((item) => selectedOptionalIds.includes(item.id))
      .reduce((sum, item) => sum + item.total, 0);

  function toggleOptional(id: string) {
    setSelectedOptionalIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  }

  function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError("Você deve aceitar os termos para prosseguir.");
      return;
    }

    startTransition(async () => {
      const result = await approveProposal(token, { name, email }, selectedOptionalIds);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Ocorreu um erro ao aprovar a proposta.");
      }
    });
  }

  return (
    <div className="investment-actions">
      <button type="button" className="accept-button" onClick={() => setIsOpen(true)}>
        <PenTool size={18} />
        Aceitar proposta
      </button>
      <small>Aceite registra nome, e-mail, data e IP como evidência.</small>

      {isOpen && (
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
              boxShadow: "var(--shadow-lg, 0 30px 90px rgb(0 0 0 / .2))",
            }}
          >
            <h3 style={{ margin: "0 0 6px", fontSize: 26, letterSpacing: "-.03em" }}>
              Confirmar aceite
            </h3>
            <p className="muted" style={{ margin: "0 0 24px" }}>
              Confirme seus dados para aceitar os termos desta proposta.
            </p>

            <form onSubmit={handleApprove} style={{ display: "grid", gap: 18 }}>
              {optionalItems.length > 0 && (
                <div style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Itens opcionais</span>
                  {optionalItems.map((item) => (
                    <label
                      key={item.id}
                      style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13 }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOptionalIds.includes(item.id)}
                        onChange={() => toggleOptional(item.id)}
                        style={{ marginTop: 3, accentColor: "var(--signal)" }}
                      />
                      <span>
                        {item.description} — {formatCurrency(item.total)}
                      </span>
                    </label>
                  ))}
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                    Total com opcionais selecionados: {formatCurrency(selectedTotal)}
                  </p>
                </div>
              )}

              <label className="field">
                <span>Nome completo</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Como você assina..."
                />
              </label>

              <label className="field">
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </label>

              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 13,
                  color: "var(--mineral)",
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "var(--signal)" }}
                />
                Declaro que li e estou de acordo com o Escopo e o Investimento desta proposta.
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
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
