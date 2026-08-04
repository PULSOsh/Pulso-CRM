"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createMilestone, deleteMilestone, toggleMilestone } from "@/server/actions/milestones";

export type MilestoneRow = {
  id: string;
  title: string;
  dueDate: Date | null;
  isCompleted: boolean;
  assignedTo: string | null;
  dependsOnMilestoneId: string | null;
};

export function MilestonesPanel({
  projectId,
  initialMilestones,
  members,
}: {
  projectId: string;
  initialMilestones: MilestoneRow[];
  members: { userId: string; name: string }[];
}) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dependsOnMilestoneId, setDependsOnMilestoneId] = useState("");

  const memberName = (userId: string | null) => members.find((m) => m.userId === userId)?.name;
  const milestoneTitle = (id: string | null) => milestones.find((m) => m.id === id)?.title;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await createMilestone(projectId, {
        title,
        dueDate: dueDate || undefined,
        assignedTo: assignedTo || undefined,
        dependsOnMilestoneId: dependsOnMilestoneId || undefined,
      });
      setMilestones([
        ...milestones,
        {
          id: created.id,
          title: created.title,
          dueDate: created.dueDate,
          isCompleted: false,
          assignedTo: created.assignedTo,
          dependsOnMilestoneId: created.dependsOnMilestoneId,
        },
      ]);
      setTitle("");
      setDueDate("");
      setAssignedTo("");
      setDependsOnMilestoneId("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar marco.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(milestone: MilestoneRow) {
    setLoading(true);
    setError(null);
    try {
      await toggleMilestone(milestone.id, projectId, !milestone.isCompleted);
      setMilestones(
        milestones.map((m) => (m.id === milestone.id ? { ...m, isCompleted: !m.isCompleted } : m)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar marco.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setError(null);
    try {
      await deleteMilestone(id, projectId);
      setMilestones(milestones.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir marco.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-2">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={m.isCompleted}
                onChange={() => handleToggle(m)}
                disabled={loading}
                className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <div>
                <span className={m.isCompleted ? "line-through text-slate-400" : "text-slate-700"}>
                  {m.title}
                </span>
                <p className="text-xs text-slate-400">
                  {m.dueDate ? new Date(m.dueDate).toLocaleDateString("pt-BR") : "Sem prazo"}
                  {m.assignedTo && ` • ${memberName(m.assignedTo) ?? "responsável"}`}
                  {m.dependsOnMilestoneId &&
                    ` • depende de "${milestoneTitle(m.dependsOnMilestoneId) ?? "..."}"`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(m.id)}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-red-600"
            >
              Excluir
            </button>
          </li>
        ))}
        {milestones.length === 0 && <li className="text-slate-500 text-sm">Nenhum marco ainda.</li>}
      </ul>

      {!showForm ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
          + Novo marco
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="space-y-2 border border-slate-200 rounded-md p-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do marco"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Sem responsável</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          {milestones.length > 0 && (
            <Select
              value={dependsOnMilestoneId}
              onChange={(e) => setDependsOnMilestoneId(e.target.value)}
            >
              <option value="">Sem dependência</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  Depende de: {m.title}
                </option>
              ))}
            </Select>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading || !title.trim()}>
              Salvar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
