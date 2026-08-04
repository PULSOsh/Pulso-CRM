"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApprovalsPanel } from "@/components/crm/approvals-panel";
import { ClientPortalPanel } from "@/components/crm/client-portal-panel";
import { FilesPanel } from "@/components/crm/files-panel";
import { MilestonesPanel, type MilestoneRow } from "@/components/crm/milestones-panel";
import { ScopeChangesPanel, type ScopeChangeRow } from "@/components/crm/scope-changes-panel";
import { TimeTrackingPanel, type TimeEntryRow } from "@/components/crm/time-tracking-panel";
import { Select } from "@/components/ui/select";
import {
  assignChecklistItem,
  toggleChecklistItem,
  updateProjectStage,
} from "@/server/actions/projects";

type ChecklistItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  assignedTo: string | null;
};

type Stage = {
  id: string;
  name: string;
  color: string | null;
};

type Project = {
  id: string;
  name: string;
  status: string;
  progress: number;
  stageId: string | null;
  checklist: ChecklistItem[];
  clientPortalEnabled: boolean;
  clientPortalToken: string;
};

type Approval = Parameters<typeof ApprovalsPanel>[0]["initialApprovals"][number];
type Member = { userId: string; name: string; email: string };
type FileRow = Parameters<typeof FilesPanel>[0]["initialFiles"];

export function ProjectDetailsClient({
  project,
  stages,
  approvals,
  members,
  milestones,
  timeEntries,
  scopeChanges,
  currentUserId,
  files,
}: {
  project: Project;
  stages: Stage[];
  approvals: Approval[];
  members: Member[];
  milestones: MilestoneRow[];
  timeEntries: TimeEntryRow[];
  scopeChanges: ScopeChangeRow[];
  currentUserId: string;
  files: FileRow;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStageChange(stageId: string) {
    setLoading(true);
    try {
      await updateProjectStage(project.id, stageId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(itemId: string, current: boolean) {
    setLoading(true);
    try {
      await toggleChecklistItem(itemId, project.id, !current);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(itemId: string, userId: string) {
    setLoading(true);
    try {
      await assignChecklistItem(itemId, project.id, userId || null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const completedCount = project.checklist.filter((i) => i.isCompleted).length;
  const memberOptions = members.map((m) => ({ userId: m.userId, name: m.name }));

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">Etapa do projeto</p>
        <Select
          value={project.stageId ?? ""}
          onChange={(e) => handleStageChange(e.target.value)}
          disabled={loading}
          className="w-full sm:w-72"
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Checklist</h2>
          <span className="text-sm text-slate-500">
            {completedCount}/{project.checklist.length} concluídos
          </span>
        </div>
        <ul className="space-y-2">
          {project.checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={() => handleToggle(item.id, item.isCompleted)}
                disabled={loading}
                className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <span
                className={`flex-1 ${item.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}
              >
                {item.title}
              </span>
              <select
                value={item.assignedTo ?? ""}
                onChange={(e) => handleAssign(item.id, e.target.value)}
                disabled={loading}
                className="text-xs border border-slate-200 rounded-md px-1.5 py-1 text-slate-600"
              >
                <option value="">Sem responsável</option>
                {memberOptions.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
          {project.checklist.length === 0 && (
            <li className="text-slate-500 text-sm">Nenhum item de checklist.</li>
          )}
        </ul>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Marcos</h2>
        <MilestonesPanel projectId={project.id} initialMilestones={milestones} members={memberOptions} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Apontamento de horas</h2>
        <TimeTrackingPanel
          projectId={project.id}
          initialEntries={timeEntries}
          currentUserId={currentUserId}
          members={memberOptions}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Alteração de escopo</h2>
        <ScopeChangesPanel projectId={project.id} initialScopeChanges={scopeChanges} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Aprovações</h2>
        <ApprovalsPanel projectId={project.id} initialApprovals={approvals} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Arquivos</h2>
        <FilesPanel entityType="project" entityId={project.id} initialFiles={files} allowPublicToggle />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Portal do cliente e encerramento</h2>
        <ClientPortalPanel
          projectId={project.id}
          clientPortalEnabled={project.clientPortalEnabled}
          clientPortalToken={project.clientPortalToken}
          status={project.status}
        />
      </div>
    </div>
  );
}
