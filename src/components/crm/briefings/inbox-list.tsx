"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

type Submission = {
  id: string;
  protocol: string;
  status: string;
  contactName: string | null;
  companyName: string | null;
  createdAt: Date;
  template: {
    name: string;
    publicTitle: string;
  } | null;
};

export function InboxList({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
        <p className="text-slate-500">Nenhum briefing recebido ainda.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "started":
      case "submitted":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Novo
          </span>
        );
      case "under_review":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Em Análise
          </span>
        );
      case "linked":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Convertido
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
            <th className="p-4 font-medium">Protocolo</th>
            <th className="p-4 font-medium">Contato</th>
            <th className="p-4 font-medium">Empresa</th>
            <th className="p-4 font-medium">Template (Serviço)</th>
            <th className="p-4 font-medium">Data</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100">
          {submissions.map((sub) => (
            <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
              <td className="p-4 font-mono text-slate-900">{sub.protocol}</td>
              <td className="p-4 font-medium text-slate-900">{sub.contactName}</td>
              <td className="p-4 text-slate-600">{sub.companyName || "-"}</td>
              <td className="p-4 text-slate-600">{sub.template?.name || "Desconhecido"}</td>
              <td className="p-4 text-slate-600">
                {format(sub.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </td>
              <td className="p-4">{getStatusBadge(sub.status)}</td>
              <td className="p-4 text-right">
                <Link
                  href={`/crm/briefings/inbox/${sub.id}`}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Ver Detalhes
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
