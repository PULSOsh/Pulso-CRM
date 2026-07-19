import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Building2, User } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { FilesPanel } from "@/components/crm/files-panel";
import { ActivityTimeline } from "@/components/crm/pipeline/activity-timeline";
import { NextActionForm } from "@/components/crm/pipeline/next-action-form";
import { OpportunityNegotiationForm } from "@/components/crm/pipeline/opportunity-negotiation-form";
import { OpportunityProductsPanel } from "@/components/crm/pipeline/opportunity-products-panel";
import { WinLoseButtons } from "@/components/crm/pipeline/win-lose-buttons";
import { getOpportunityActivities } from "@/server/actions/activities";
import { getFilesForEntity } from "@/server/actions/files";
import { getActiveOrganizationId } from "@/server/actions/organization";
import { getProducts } from "@/server/actions/products";
import { auth } from "@/server/auth";
import { db } from "@/server/db/connection";
import {
  briefingSubmissions,
  companies,
  contacts,
  contracts,
  opportunities,
  pipelineStages,
  projects,
  proposals,
} from "@/server/db/schema";

export default async function OpportunityDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const orgId = await getActiveOrganizationId(session.user.id);

  const opp = await db.query.opportunities.findFirst({
    where: and(eq(opportunities.id, id), eq(opportunities.organizationId, orgId)),
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

  const activities = await getOpportunityActivities(opp.id);
  const files = await getFilesForEntity("opportunity", opp.id);
  const serializedActivities = activities.map((a) => ({
    ...a,
    occurredAt: a.occurredAt.toISOString(),
  }));

  const [linkedProducts, catalog] = await Promise.all([
    db.query.opportunityProducts.findMany({
      where: (t, { eq }) => eq(t.opportunityId, opp.id),
      with: { product: { columns: { name: true } } },
    }),
    getProducts(),
  ]);

  // Reverse links that already exist in the schema but were never surfaced
  // anywhere on this page - if a briefing/proposal/contract/project was
  // created from this opportunity, show it here instead of leaving the
  // relationship invisible.
  const [linkedBriefing, linkedProposal, linkedContract, linkedProject] = await Promise.all([
    db.query.briefingSubmissions.findFirst({
      where: and(
        eq(briefingSubmissions.opportunityId, opp.id),
        eq(briefingSubmissions.organizationId, orgId),
      ),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      columns: { id: true, protocol: true, status: true },
    }),
    db.query.proposals.findFirst({
      where: and(eq(proposals.opportunityId, opp.id), eq(proposals.organizationId, orgId)),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      columns: { id: true, title: true, status: true },
    }),
    db.query.contracts.findFirst({
      where: and(eq(contracts.opportunityId, opp.id), eq(contracts.organizationId, orgId)),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      columns: { id: true, code: true, status: true },
    }),
    db.query.projects.findFirst({
      where: and(eq(projects.opportunityId, opp.id), eq(projects.organizationId, orgId)),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      columns: { id: true, name: true, status: true },
    }),
  ]);

  return (
    <AppShell active="crm" eyebrow="COMERCIAL" title={opp.title}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
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
            <OpportunityNegotiationForm opportunity={opp} />

            <OpportunityProductsPanel
              opportunityId={opp.id}
              linkedProducts={linkedProducts}
              catalog={catalog}
            />

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

            <div className="bg-white border border-slate-200 rounded-xl p-8">
              <h2 className="font-semibold text-lg mb-4">Linha do tempo</h2>
              <ActivityTimeline opportunityId={opp.id} activities={serializedActivities} />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8">
              <h2 className="font-semibold text-lg mb-4">Arquivos</h2>
              <FilesPanel entityType="opportunity" entityId={opp.id} initialFiles={files} />
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

            {(linkedBriefing || linkedProposal || linkedContract || linkedProject) && (
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Vínculos</h3>
                <div className="space-y-3 text-sm">
                  {linkedBriefing && (
                    <Link
                      href={`/crm/briefings/inbox/${linkedBriefing.id}`}
                      className="flex items-center justify-between hover:text-orange-600"
                    >
                      <span>Briefing #{linkedBriefing.protocol}</span>
                      <span className="text-slate-400 capitalize">{linkedBriefing.status}</span>
                    </Link>
                  )}
                  {linkedProposal && (
                    <div className="flex items-center justify-between">
                      <span>Proposta: {linkedProposal.title}</span>
                      <span className="text-slate-400 capitalize">{linkedProposal.status}</span>
                    </div>
                  )}
                  {linkedContract && (
                    <Link
                      href={`/crm/contratos/${linkedContract.id}`}
                      className="flex items-center justify-between hover:text-orange-600"
                    >
                      <span>Contrato {linkedContract.code}</span>
                      <span className="text-slate-400 capitalize">{linkedContract.status}</span>
                    </Link>
                  )}
                  {linkedProject && (
                    <Link
                      href={`/crm/projetos/${linkedProject.id}`}
                      className="flex items-center justify-between hover:text-orange-600"
                    >
                      <span>Projeto: {linkedProject.name}</span>
                      <span className="text-slate-400 capitalize">{linkedProject.status}</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
