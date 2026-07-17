import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function BriefingSuccessPage({
  searchParams,
}: {
  params: { slug: string };
  searchParams: { protocolo?: string };
}) {
  const protocol = searchParams.protocolo || `PULSO-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Briefing Enviado!</h1>
        <p className="text-slate-600 mb-6">
          Recebemos suas respostas com sucesso. Nossa equipe já foi notificada e entrará em contato
          em breve.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-8">
          <p className="text-sm text-slate-500 mb-1">Número do Protocolo</p>
          <p className="font-mono font-bold text-lg text-slate-900">{protocol}</p>
        </div>

        <Link
          href="/"
          className="inline-block w-full px-6 py-3 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 transition-colors"
        >
          Voltar para o site principal
        </Link>
      </div>
    </div>
  );
}
