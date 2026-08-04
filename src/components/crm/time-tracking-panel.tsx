"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteTimeEntry, logTime } from "@/server/actions/time-entries";

export type TimeEntryRow = {
  id: string;
  userId: string | null;
  workDate: Date;
  hours: string;
  description: string | null;
};

export function TimeTrackingPanel({
  projectId,
  initialEntries,
  currentUserId,
  members,
}: {
  projectId: string;
  initialEntries: TimeEntryRow[];
  currentUserId: string;
  members: { userId: string; name: string }[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberName = (userId: string | null) =>
    members.find((m) => m.userId === userId)?.name ?? "-";
  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const entry = await logTime(projectId, { workDate, hours, description });
      setEntries([
        { id: entry.id, userId: entry.userId, workDate: entry.workDate, hours: entry.hours, description: entry.description },
        ...entries,
      ]);
      setHours("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao lançar horas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setError(null);
    try {
      await deleteTimeEntry(id, projectId);
      setEntries(entries.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir apontamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Total apontado: <strong className="text-slate-900">{totalHours.toFixed(1)}h</strong>
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-1 text-sm">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between gap-3">
            <span className="text-slate-700">
              {new Date(entry.workDate).toLocaleDateString("pt-BR")} — {Number(entry.hours)}h —{" "}
              {memberName(entry.userId)}
              {entry.description && ` (${entry.description})`}
            </span>
            {entry.userId === currentUserId && (
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-red-600 shrink-0"
              >
                Excluir
              </button>
            )}
          </li>
        ))}
        {entries.length === 0 && <li className="text-slate-500">Nenhum apontamento ainda.</li>}
      </ul>

      {!showForm ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
          + Lançar horas
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 border border-slate-200 rounded-md p-3">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} required />
            <Input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Horas"
              required
            />
          </div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que foi feito (opcional)"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading || !hours}>
              Salvar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
