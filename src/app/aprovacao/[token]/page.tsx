import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, MessageSquareWarning, XCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublicApproval } from "@/server/actions/public-approval";
import DecideModal from "./decide-modal";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Aguardando decisão",
    className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  approved: {
    label: "Aprovada",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  approved_with_notes: {
    label: "Aprovada com observações",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  rejected: {
    label: "Ajuste solicitado",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  expired: { label: "Expirada", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  cancelled: {
    label: "Cancelada",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
};

export default async function PublicApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const approval = await getPublicApproval(token);

  if (!approval) {
    notFound();
  }

  const badge = STATUS_BADGE[approval.status] ?? STATUS_BADGE.pending;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center font-bold text-white tracking-tighter">
            P
          </div>
          <span className="font-semibold text-white tracking-wide">PULSO</span>
        </div>
        <span className={`px-3 py-1 rounded-full border text-sm font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </nav>

      <main className="max-w-3xl mx-auto pt-32 pb-40 px-6">
        <header className="mb-12 space-y-4">
          {approval.projectName && (
            <p className="text-sm uppercase tracking-wider text-slate-500">
              {approval.projectName}
            </p>
          )}
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
            {approval.title}
          </h1>
          <p className="text-slate-400 text-sm">
            Solicitado em{" "}
            {format(new Date(approval.requestedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </header>

        {approval.description && (
          <section className="mb-12 bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8">
            <p className="whitespace-pre-wrap text-slate-300 text-sm md:text-base">
              {approval.description}
            </p>
          </section>
        )}

        {approval.files.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Arquivos</h2>
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-3">
              {approval.files.map((file) => (
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

        {approval.status === "pending" ? (
          <DecideModal token={token} />
        ) : (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              {approval.status === "rejected" ? (
                <XCircle className="text-red-500" size={20} />
              ) : (
                <CheckCircle2 className="text-emerald-500" size={20} />
              )}
              <span className="font-medium text-white">{badge.label}</span>
            </div>
            {approval.decisionNotes && (
              <p className="flex items-start gap-2 text-sm text-slate-400">
                <MessageSquareWarning size={16} className="mt-0.5 shrink-0" />
                {approval.decisionNotes}
              </p>
            )}
            {approval.decidedAt && (
              <p className="text-xs text-slate-500">
                Decidido em{" "}
                {format(new Date(approval.decidedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
