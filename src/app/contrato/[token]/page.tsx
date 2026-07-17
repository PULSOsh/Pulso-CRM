import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, FileSignature } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicContract } from "@/server/actions/contracts";
import SignModal from "./sign-modal";

export default async function PublicContractPage({ params }: { params: { token: string } }) {
  const contract = await getPublicContract(params.token);

  if (!contract) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center font-bold text-white tracking-tighter">
            P
          </div>
          <span className="font-semibold text-white tracking-wide">PULSO</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-slate-400 hidden md:inline-block">Contrato Nº {contract.code}</span>
          {contract.status === "signed" ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Assinado
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
              Aguardando assinatura
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto pt-32 pb-40 px-6">
        <header className="mb-12 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight flex items-center gap-3">
            <FileSignature size={32} className="text-orange-500" />
            {contract.title}
          </h1>
          <p className="text-slate-400 text-sm">
            Emitido em{" "}
            {format(new Date(contract.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </header>

        <section className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="whitespace-pre-wrap text-slate-300 text-sm md:text-base leading-relaxed">
            {contract.content}
          </div>
        </section>

        {contract.signedAt && (
          <p className="mt-6 text-sm text-emerald-400">
            Assinado digitalmente em{" "}
            {format(new Date(contract.signedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
            .
          </p>
        )}
      </main>

      {contract.status === "sent" && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex justify-center items-center z-50">
          <SignModal token={params.token} />
        </div>
      )}
    </div>
  );
}
