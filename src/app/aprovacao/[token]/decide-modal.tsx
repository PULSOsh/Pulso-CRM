"use client";

import { AlertTriangle, CheckCircle2, Loader2, MessageSquareWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideApproval } from "@/server/actions/public-approval";

type Mode = "approve" | "approve_with_notes" | "reject";

export default function DecideModal({ token }: { token: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mode) return;
    setError(null);

    const decision =
      mode === "approve"
        ? "approved"
        : mode === "approve_with_notes"
          ? "approved_with_notes"
          : "rejected";

    startTransition(async () => {
      const result = await decideApproval(token, decision, { name, email, comment });
      if (result.success) {
        setMode(null);
        router.refresh();
      } else {
        setError(result.error || "Ocorreu um erro ao registrar a decisão.");
      }
    });
  }

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <button
          type="button"
          className="accept-button"
          style={{ padding: "0 24px" }}
          onClick={() => setMode("approve")}
        >
          <CheckCircle2 size={20} />
          Aprovar
        </button>
        <button
          type="button"
          className="secondary-button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 56,
            padding: "0 20px",
          }}
          onClick={() => setMode("approve_with_notes")}
        >
          <MessageSquareWarning size={18} />
          Aprovar com observação
        </button>
        <button
          type="button"
          className="secondary-button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minHeight: 56,
            padding: "0 20px",
            color: "var(--danger)",
          }}
          onClick={() => setMode("reject")}
        >
          <AlertTriangle size={18} />
          Solicitar ajuste
        </button>
      </div>

      {mode && (
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
              {mode === "approve" && "Confirmar aprovação"}
              {mode === "approve_with_notes" && "Aprovar com observação"}
              {mode === "reject" && "Solicitar ajuste"}
            </h3>
            <p className="muted" style={{ margin: "0 0 24px" }}>
              {mode === "reject"
                ? "Descreva o que precisa ser ajustado. Isso cria uma tarefa para a equipe."
                : "Confirme seus dados para registrar sua decisão."}
            </p>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
              <label className="field">
                <span>Nome completo</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>E-mail</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>

              {mode !== "approve" && (
                <label className="field">
                  <span>{mode === "reject" ? "O que precisa ser ajustado" : "Observação"}</span>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "white",
                      font: "inherit",
                    }}
                  />
                </label>
              )}

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
                  onClick={() => setMode(null)}
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
    </>
  );
}
