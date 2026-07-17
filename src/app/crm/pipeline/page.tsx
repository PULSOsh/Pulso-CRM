import { LayoutDashboard } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { KanbanBoard } from "@/components/crm/pipeline/kanban-board";
import { getPipelineWithOpportunities } from "@/server/actions/pipeline";
import { auth } from "@/server/auth";

export default async function PipelinePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // TODO: Get active org ID from session/context
  const orgId = "00000000-0000-0000-0000-000000000000";

  const data = await getPipelineWithOpportunities(orgId);

  // Map backend types to frontend types for the Kanban
  const mappedStages = data.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    opportunities: stage.opportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      company: opp.company,
      primaryContact: opp.primaryContact,
      estimatedValue: opp.estimatedValue,
      position: opp.position,
      stageId: opp.stageId,
    })),
  }));

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard size={24} className="text-orange-600" />
            {data.pipeline.name}
          </h1>
          <p className="text-slate-500 mt-1">Gerencie suas negociações arrastando os cards</p>
        </div>
      </div>

      <KanbanBoard initialStages={mappedStages} userId={session.user.id} orgId={orgId} />
    </div>
  );
}
