import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { KanbanBoard } from "@/components/crm/pipeline/kanban-board";
import { getCompanies } from "@/server/actions/companies";
import { getContacts } from "@/server/actions/contacts";
import { getPipelineWithOpportunities } from "@/server/actions/pipeline";
import { auth } from "@/server/auth";

export default async function PipelinePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const data = await getPipelineWithOpportunities();
  const companies = await getCompanies();
  const contacts = await getContacts();

  // Map backend types to frontend types for the Kanban
  const mappedStages = data.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    valueTotal: stage.valueTotal,
    opportunities: stage.opportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      company: opp.company,
      primaryContact: opp.primaryContact,
      estimatedValue: opp.estimatedValue,
      position: opp.position,
      stageId: opp.stageId,
      nextActionAt: opp.nextActionAt ? opp.nextActionAt.toISOString() : null,
      nextActionDescription: opp.nextActionDescription,
      temperature: opp.temperature,
      owner: opp.owner,
      productName: opp.productName,
      activitiesCount: opp.activitiesCount,
      openTasksCount: opp.openTasksCount,
    })),
  }));

  return (
    <AppShell active="crm" eyebrow="COMERCIAL" title={data.pipeline.name}>
      <div className="p-4 md:p-8 h-full flex flex-col">
        <KanbanBoard
          initialStages={mappedStages}
          pipelineId={data.pipeline.id}
          summary={data.summary}
          companies={companies.map((c) => ({ id: c.id, name: c.tradeName }))}
          contacts={contacts.map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName || ""}`.trim(),
          }))}
        />
      </div>
    </AppShell>
  );
}
