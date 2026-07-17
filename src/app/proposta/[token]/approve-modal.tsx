"use client";

import { CheckCircle2, Loader2, PenTool } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveProposal } from "@/server/actions/public-quote";

export default function ApproveModal({ token }: { token: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      alert("Você deve aceitar os termos para prosseguir.");
      return;
    }

    startTransition(async () => {
      const result = await approveProposal(token, { name, email });
      if (result.success) {
        setIsOpen(false);
        router.refresh(); // Refresh the page to show approved status
      } else {
        alert(result.error || "Ocorreu um erro ao aprovar a proposta.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-full font-semibold shadow-[0_0_40px_-10px_rgba(5,150,105,0.5)] hover:bg-emerald-500 hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(5,150,105,0.7)] transition-all duration-300"
      >
        <PenTool size={24} />
        Aprovar Proposta
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Assinatura Digital</h3>
            <p className="text-slate-400 text-sm mb-8">
              Confirme seus dados para aceitar os termos desta proposta.
            </p>

            <form onSubmit={handleApprove} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-300">
                  Nome Completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="Como você assina..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  E-mail Corporativo
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                  className="mt-1 w-5 h-5 rounded bg-slate-950 border-white/10 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="terms" className="text-sm text-slate-400">
                  Declaro que li e estou de acordo com o Escopo, o Investimento e os Termos e
                  Condições estipulados nesta proposta.
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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
