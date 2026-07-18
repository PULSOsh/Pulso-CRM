"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateNextAction } from "@/server/actions/opportunities";

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NextActionForm({
  opportunityId,
  initialAt,
  initialDescription,
}: {
  opportunityId: string;
  initialAt: string | null;
  initialDescription: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [at, setAt] = useState(toLocalInputValue(initialAt));
  const [description, setDescription] = useState(initialDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateNextAction(opportunityId, {
          nextActionAt: at ? new Date(at).toISOString() : null,
          nextActionDescription: description.trim() || null,
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="nextActionAt" className="text-sm font-medium text-slate-700">
            Data da próxima ação
          </label>
          <Input
            id="nextActionAt"
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="nextActionDescription" className="text-sm font-medium text-slate-700">
            O que fazer
          </label>
          <Input
            id="nextActionDescription"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={240}
            placeholder="Ex: Ligar pra confirmar orçamento"
            className="mt-1"
          />
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && !error && <p className="text-green-600 text-sm">Próxima ação salva.</p>}
      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Salvando..." : "Salvar próxima ação"}
      </Button>
    </form>
  );
}
