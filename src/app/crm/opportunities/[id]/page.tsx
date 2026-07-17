import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Building2, CheckCircle2, User, XCircle } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getActiveOrganizationId } from "@/server/actions/organization";
import { auth } from "@/server/auth";
import { db } from "@/server/db/connection";
import { companies, contacts, opportunities, pipelineStages } from "@/server/db/schema";

export default async function OpportunityDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const orgId = await getActiveOrganizationId(session.user.id);

  const opp = await db.query.opportunities.findFirst({
    where: and(eq(opportunities.id, params.id), eq(opportunities.organizationId, orgId)),
  });

  if (!opp) notFound();

  const company = opp.companyId
    ? await db.query.companies.findFirst({ where: eq(companies.id, opp.companyId) })
    : null;

  const primaryContact = opp.primaryContactId
    ? await db.query.contacts.findFirst({ where: eq(contacts.id, opp.primaryContactId) })
    : null;

  const stage = await db.query.pipelineStages.findFirst({
    where: eq(pipelineStages.id, opp.stageId),
  });

  // Also try to find a linked briefing submission
  const _linkedBriefing = await db.query.briefingSubmissions.findFirst({
    where: eq(opportunities.id, params.id), // Note: briefingSubmissions has opportunityId, wait...
    // Let's just fetch it normally
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/crm/pipeline"
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{opp.title}</h1>
          <p className="text-slate-500">
            Funil Atual: {stage?.name} • Criado em{" "}
            {format(opp.createdAt, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          {/* Main Content Area */}
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <h2 className="font-semibold text-lg mb-4">Informações da Negociação</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-100 pb-4">
                <span className="text-slate-500">Valor Estimado</span>
                <span className="font-semibold text-slate-900">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    Number(opp.estimatedValue),
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-4">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-900 capitalize">{opp.status}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-slate-500">Origem</span>
                <span className="font-semibold text-slate-900">{opp.source || "-"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <h2 className="font-semibold text-lg mb-4">Ações (Em breve)</h2>
            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 bg-green-50 text-green-700 border border-green-200 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
              >
                <CheckCircle2 size={20} /> Ganho
              </button>
              <button
                type="button"
                className="flex-1 bg-red-50 text-red-700 border border-red-200 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              >
                <XCircle size={20} /> Perdido
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Side Panel Area */}
          {primaryContact && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <User size={18} className="text-slate-400" />
                Contato Principal
              </h3>
              <p className="font-medium text-slate-900">
                {primaryContact.firstName} {primaryContact.lastName}
              </p>
              <p className="text-slate-500 text-sm mt-1">{primaryContact.email}</p>
              <p className="text-slate-500 text-sm mt-1">
                {primaryContact.phone || "Sem telefone"}
              </p>
            </div>
          )}

          {company && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-slate-400" />
                Empresa
              </h3>
              <p className="font-medium text-slate-900">{company.tradeName}</p>
              <p className="text-slate-500 text-sm mt-1">
                CNPJ: {company.documentNumber || "Não informado"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
