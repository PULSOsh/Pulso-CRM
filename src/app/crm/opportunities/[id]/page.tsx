import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Building2, User } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NextActionForm } from "@/components/crm/pipeline/next-action-form";
import { WinLoseButtons } from "@/components/crm/pipeline/win-lose-buttons";
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
            <h2 className="font-semibold text-lg mb-4">Próxima ação</h2>
            <NextActionForm
              opportunityId={opp.id}
              initialAt={opp.nextActionAt ? opp.nextActionAt.toISOString() : null}
              initialDescription={opp.nextActionDescription}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <h2 className="font-semibold text-lg mb-4">Ações</h2>
            <WinLoseButtons opportunityId={opp.id} status={opp.status} />
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
