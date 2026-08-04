"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { decideScopeChange, requestScopeChange } from "@/server/actions/scope-changes";

export type ScopeChangeRow = {
  id: string;
  title: string;
  description: string | null;
  valueDelta: string;
  deadlineDeltaDays: number | null;
  status: string;
  decisionNotes: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando decisão",
  approved: "Aprovada",
  rejected: "Rejeitada",
};

export function ScopeChangesPanel({
  projectId,
  initialScopeChanges,
}: {
  projectId: string;
  initialScopeChanges: ScopeChangeRow[];
}) {
  const [scopeChanges, setScopeChanges] = useState(initialScopeChanges);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [valueDelta, setValueDelta] = useState("");
  const [deadlineDeltaDays, setDeadlineDeltaDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await requestScopeChange(projectId, {
        title,
        description,
        valueDelta: valueDelta || 0,
        deadlineDeltaDays: deadlineDeltaDays || undefined,
      });
      setScopeChanges([
        {
          id: created.id,
          title: created.title,
          description: created.description,
          valueDelta: created.valueDelta,
          deadlineDeltaDays: created.deadlineDeltaDays,
          status: created.status,
          decisionNotes: created.decisionNotes,
        },
        ...scopeChanges,
      ]);
      setTitle("");
      setDescription("");
      setValueDelta("");
      setDeadlineDeltaDays("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar alteração de escopo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecide(id: string, approved: boolean) {
    setLoading(true);
    setError(null);
    try {
      await decideScopeChange(id, projectId, { approved });
      setScopeChanges(
        scopeChanges.map((s) => (s.id === id ? { ...s, status: approved ? "approved" : "rejected" } : s)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao decidir.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-2">
        {scopeChanges.map((s) => (
          <li key={s.id} className="border border-slate-200 rounded-md p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500">
                  {STATUS_LABELS[s.status] ?? s.status} • Impacto: R${" "}
                  {Number(s.valueDelta).toFixed(2)}
                  {s.deadlineDeltaDays ? ` • ${s.deadlineDeltaDays} dia(s) no prazo` : ""}
                </p>
              </div>
              {s.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" disabled={loading} onClick={() => handleDecide(s.id, true)}>
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleDecide(s.id, false)}
                  >
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          </li>
        ))}
        {scopeChanges.length === 0 && (
          <li className="text-slate-500 text-sm">Nenhuma alteração de escopo registrada.</li>
        )}
      </ul>

      {!showForm ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
          + Solicitar alteração de escopo
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="space-y-2 border border-slate-200 rounded-md p-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" required />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              step="0.01"
              value={valueDelta}
              onChange={(e) => setValueDelta(e.target.value)}
              placeholder="Impacto no valor (R$)"
            />
            <Input
              type="number"
              value={deadlineDeltaDays}
              onChange={(e) => setDeadlineDeltaDays(e.target.value)}
              placeholder="Impacto no prazo (dias)"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} disabled={loading}>
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
