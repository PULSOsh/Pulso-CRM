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
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => setMode("approve")}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-full font-semibold shadow-[0_0_40px_-10px_rgba(5,150,105,0.5)] hover:bg-emerald-500 hover:scale-105 transition-all duration-300"
        >
          <CheckCircle2 size={24} />
          Aprovar
        </button>
        <button
          type="button"
          onClick={() => setMode("approve_with_notes")}
          className="flex items-center gap-3 px-6 py-4 bg-slate-800 text-white rounded-full font-semibold border border-white/10 hover:bg-slate-700 transition-colors"
        >
          <MessageSquareWarning size={20} />
          Aprovar com observação
        </button>
        <button
          type="button"
          onClick={() => setMode("reject")}
          className="flex items-center gap-3 px-6 py-4 bg-slate-800 text-white rounded-full font-semibold border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
        >
          <AlertTriangle size={20} />
          Solicitar ajuste
        </button>
      </div>

      {mode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">
              {mode === "approve" && "Confirmar aprovação"}
              {mode === "approve_with_notes" && "Aprovar com observação"}
              {mode === "reject" && "Solicitar ajuste"}
            </h3>
            <p className="text-slate-400 text-sm mb-8">
              {mode === "reject"
                ? "Descreva o que precisa ser ajustado. Isso cria uma tarefa para a equipe."
                : "Confirme seus dados para registrar sua decisão."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-300">
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {mode !== "approve" && (
                <div className="space-y-2">
                  <label htmlFor="comment" className="text-sm font-medium text-slate-300">
                    {mode === "reject" ? "O que precisa ser ajustado" : "Observação"}
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  disabled={isPending}
                  className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={20} />
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
