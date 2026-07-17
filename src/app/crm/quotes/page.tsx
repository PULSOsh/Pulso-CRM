import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Plus } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveOrganizationId } from "@/server/actions/organization";
import { getQuotes } from "@/server/actions/quotes";
import { auth } from "@/server/auth";

export default async function QuotesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const orgId = await getActiveOrganizationId(session.user.id);
  const quotes = await getQuotes(orgId);

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-orange-600" />
            Orçamentos e Propostas
          </h1>
          <p className="text-slate-500 mt-1">
            Gere propostas profissionais para suas oportunidades
          </p>
        </div>

        <Link
          href="/crm/quotes/new"
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
        >
          <Plus size={16} />
          Nova Proposta
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl flex-1 overflow-hidden flex flex-col">
        {quotes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <FileText size={48} className="mb-4 text-slate-300" />
            <p>Nenhuma proposta gerada.</p>
            <p className="text-sm">Clique em "Nova Proposta" para começar.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Código</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Título / Cliente</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Valor Total</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Data</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-500">{quote.code}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{quote.title}</p>
                      {quote.opportunity && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {quote.opportunity.company?.tradeName ||
                            quote.opportunity.contact?.firstName ||
                            "Cliente não vinculado"}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(quote.total))}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
                        ${
                          quote.status === "draft"
                            ? "bg-slate-100 text-slate-800"
                            : quote.status === "sent"
                              ? "bg-blue-100 text-blue-800"
                              : quote.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {quote.status === "draft" ? "Rascunho" : quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(quote.createdAt), "dd MMM yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* For now we just preview, edit will be complex */}
                      {quote.publicToken ? (
                        <Link
                          href={`/proposta/${quote.publicToken}`}
                          target="_blank"
                          className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Ver Proposta
                        </Link>
                      ) : (
                        <span className="text-slate-400">Não publicada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
