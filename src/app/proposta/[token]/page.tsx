import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicProposal } from "@/server/actions/public-quote";
import ApproveModal from "./approve-modal";

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proposal = await getPublicProposal(token);

  if (!proposal) {
    notFound();
  }

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(value),
    );
  };

  const whatsappMessage = encodeURIComponent(
    `Olá! Estou com a proposta *${proposal.code} - ${proposal.title}* aberta e gostaria de tirar algumas dúvidas.`,
  );
  const whatsappUrl = `https://wa.me/5511999999999?text=${whatsappMessage}`; // Using placeholder number, can be configured later

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center font-bold text-white tracking-tighter">
            P
          </div>
          <span className="font-semibold text-white tracking-wide">PULSO</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-slate-400 hidden md:inline-block">Proposta Nº {proposal.code}</span>
          {proposal.status === "approved" ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Aprovada
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
              {["draft", "sent", "viewed"].includes(proposal.status)
                ? "Em Análise"
                : proposal.status}
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-32 pb-40 px-6">
        {/* Header Section */}
        <header className="mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            {proposal.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <div className="flex flex-col">
              <span className="uppercase tracking-wider text-xs font-semibold text-slate-500 mb-1">
                Emitido em
              </span>
              <span className="text-slate-300">
                {format(new Date(proposal.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            {proposal.validUntil && (
              <div className="flex flex-col">
                <span className="uppercase tracking-wider text-xs font-semibold text-slate-500 mb-1">
                  Válido até
                </span>
                <span className="text-slate-300">
                  {format(new Date(proposal.validUntil), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Investment (Items) */}
        <section className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-orange-600 rounded-full"></span>
            Investimento Estimado
          </h2>

          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 space-y-6">
              {proposal.items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-400 shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-200">{item.description}</h3>
                      <p className="text-slate-500 text-sm mt-1">
                        {item.quantity} {Number(item.quantity) === 1 ? "unidade" : "unidades"} ×{" "}
                        {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="text-xl font-semibold text-white text-right shrink-0">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-950/50 p-6 md:p-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left w-full md:w-auto">
                <p className="text-slate-400 font-medium">Investimento Total</p>
                {Number(proposal.discount) > 0 && (
                  <p className="text-sm text-emerald-400">
                    Inclui {formatCurrency(proposal.discount)} em descontos
                  </p>
                )}
              </div>
              <div className="text-4xl font-bold text-orange-500 tracking-tight">
                {formatCurrency(proposal.total)}
              </div>
            </div>
          </div>
        </section>

        {/* Scope */}
        {proposal.version.scope && (
          <section className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-orange-600 rounded-full"></span>
              Escopo do Projeto
            </h2>
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="prose prose-invert prose-orange max-w-none prose-p:leading-relaxed prose-li:marker:text-orange-500 whitespace-pre-wrap text-slate-300 text-sm md:text-base">
                {proposal.version.scope}
              </div>
            </div>
          </section>
        )}

        {/* Terms */}
        {proposal.version.terms && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-orange-600 rounded-full"></span>
              Termos e Condições
            </h2>
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="prose prose-invert prose-orange max-w-none prose-p:leading-relaxed whitespace-pre-wrap text-slate-400 text-sm">
                {proposal.version.terms}
              </div>
            </div>
          </section>
        )}

        {/* Attached files */}
        {proposal.files.length > 0 && (
          <section className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-orange-600 rounded-full"></span>
              Arquivos
            </h2>
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl space-y-3">
              {proposal.files.map((file) => (
                <a
                  key={file.url}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3 text-sm text-slate-200 hover:border-orange-500/40 hover:text-orange-400 transition-colors"
                >
                  <span>{file.label || file.originalName}</span>
                  <span className="text-slate-500">Baixar →</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex justify-center items-center gap-4 z-50">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 px-8 py-4 ${proposal.status === "approved" ? "bg-orange-600 shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)]" : "bg-slate-800 shadow-xl border border-white/10"} text-white rounded-full font-semibold hover:scale-105 transition-all duration-300`}
        >
          <MessageCircle size={24} />
          Falar com Especialista
        </a>

        {["draft", "sent", "viewed"].includes(proposal.status) && <ApproveModal token={token} />}
      </div>
    </div>
  );
}
