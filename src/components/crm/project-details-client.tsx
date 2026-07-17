"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleChecklistItem, updateProjectStage } from "@/server/actions/projects";

type ChecklistItem = {
  id: string;
  title: string;
  isCompleted: boolean;
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
};

export function ProjectDetailsClient({ project, stages }: { project: Project; stages: Stage[] }) {
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

  const completedCount = project.checklist.filter((i) => i.isCompleted).length;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">Etapa do projeto</p>
        <select
          value={project.stageId ?? ""}
          onChange={(e) => handleStageChange(e.target.value)}
          disabled={loading}
          className="w-full sm:w-72 px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
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
              <span className={item.isCompleted ? "line-through text-slate-400" : "text-slate-700"}>
                {item.title}
              </span>
            </li>
          ))}
          {project.checklist.length === 0 && (
            <li className="text-slate-500 text-sm">Nenhum item de checklist.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
