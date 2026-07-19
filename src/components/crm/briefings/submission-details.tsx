"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  approveBriefingSubmission,
  type getBriefingSubmissionById,
} from "@/server/actions/briefing-submissions";

export function SubmissionDetails({
  submission,
}: {
  submission: NonNullable<Awaited<ReturnType<typeof getBriefingSubmissionById>>>;
}) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);
    try {
      await approveBriefingSubmission(submission.id);
      // Success is handled by server revalidation and navigating/updating
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setIsApproving(false);
    }
  };

  const isLinked = submission.status === "linked";
  const submissionUserAgent = (submission.metadata as { userAgent?: string })?.userAgent;
  // As respostas ficam em metadata.answers (jsonb, sem FK), não na tabela
  // normalizada briefing_submission_answers - ver src/app/api/public/
  // briefing/submit/route.ts pro porquê.
  const rawAnswers = (submission.metadata as { answers?: Record<string, unknown> })?.answers ?? {};
  const answerEntries = Object.entries(rawAnswers).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });
  const prettifyKey = (key: string) =>
    key
      .replace(/^q_/, "")
      .replace(/_/g, " ")
      .replace(/^./, (c) => c.toUpperCase());

  return (
    <div className="max-w-6xl mx-auto flex gap-8 items-start">
      {/* Left Column: Briefing Answers */}
      <div className="flex-1 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/crm/briefings/inbox"
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Respostas do Briefing</h2>
              <p className="text-slate-500">Template: {submission.template?.name}</p>
            </div>
            {isLinked && (
              <div className="ml-auto bg-green-100 text-green-800 px-4 py-2 rounded-md flex items-center gap-2 font-medium">
                <CheckCircle size={20} />
                Aprovado e Vinculado
              </div>
            )}
          </div>

          <div className="space-y-8">
            {answerEntries.map(([key, value]) => (
              <div key={key} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                <h4 className="text-sm font-medium text-slate-500 mb-2">{prettifyKey(key)}</h4>
                <div className="text-slate-900 text-lg">
                  {Array.isArray(value) ? (
                    <ul className="list-disc pl-5">
                      {value.map((v: string) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                  ) : typeof value === "object" ? (
                    JSON.stringify(value)
                  ) : (
                    String(value || "-")
                  )}
                </div>
              </div>
            ))}

            {answerEntries.length === 0 && (
              <p className="text-slate-500 italic">Nenhuma resposta registrada.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Metadata & Actions */}
      <div className="w-80 flex-shrink-0 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={18} />
            Metadados
          </h3>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Protocolo</p>
              <p className="font-mono font-medium text-slate-900">{submission.protocol}</p>
            </div>
            <div>
              <p className="text-slate-500">Data de Envio</p>
              <p className="font-medium text-slate-900">
                {format(new Date(submission.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-slate-500">IP / User Agent</p>
              <p className="text-xs font-mono text-slate-600 truncate" title={submissionUserAgent}>
                {submissionUserAgent || "Desconhecido"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User size={18} />
            Informações do Lead
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <User size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">{submission.contactName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-600">{submission.contactEmail || "Sem e-mail"}</p>
                {/* Simulated Duplication check */}
                {submission.contactEmail && !isLinked && (
                  <p className="text-xs text-orange-600 mt-1">
                    Este e-mail será mesclado ou criado.
                  </p>
                )}
              </div>
            </div>

            {submission.companyName && (
              <div className="flex items-start gap-3">
                <Building2 size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-600">{submission.companyName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {!isLinked && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <h3 className="font-semibold text-orange-900 mb-2">Aprovar Lead</h3>
            <p className="text-sm text-orange-800 mb-4">
              Ao aprovar, o sistema irá validar o e-mail, criar/vincular um Contato, uma Empresa e
              abrir uma Oportunidade no seu Funil de Vendas.
            </p>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-4">{error}</div>
            )}

            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isApproving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Aprovar e Converter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
