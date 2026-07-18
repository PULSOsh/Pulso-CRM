"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addNote } from "@/server/actions/activities";

type ActivityItem = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  occurredAt: string;
  actor: { name: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  note: "Nota",
  stage_change: "Etapa",
  system: "Sistema",
  task: "Tarefa",
};

export function ActivityTimeline({
  opportunityId,
  activities,
}: {
  opportunityId: string;
  activities: ActivityItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addNote(opportunityId, { body: note });
        setNote("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao adicionar nota.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Adicionar nota..."
          required
          className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {activities.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma atividade registrada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={activity.id} className="border-l-2 border-slate-200 pl-4 py-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="uppercase font-semibold tracking-wide">
                  {TYPE_LABELS[activity.type] ?? activity.type}
                </span>
                <span>•</span>
                <span>
                  {format(new Date(activity.occurredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
                {activity.actor?.name && (
                  <>
                    <span>•</span>
                    <span>{activity.actor.name}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-900 mt-0.5">{activity.title}</p>
              {activity.body && <p className="text-sm text-slate-600 mt-0.5">{activity.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
