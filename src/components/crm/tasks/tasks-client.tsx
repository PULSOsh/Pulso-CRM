"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, CheckSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { completeTask, createTask, reopenTask, setTaskRecurrence } from "@/server/actions/tasks";

type TaskItem = {
  id: string;
  title: string;
  dueAt: string | null;
  priority: string;
  opportunity: { title: string } | null;
};

function ReopenControl({
  taskId,
  isPending,
  onReopen,
}: {
  taskId: string;
  isPending: boolean;
  onReopen: (taskId: string, reason: string) => void;
}) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!reasonOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setReasonOpen(true)} disabled={isPending}>
        Reabrir
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo da reabertura..."
        className="w-56"
      />
      <Button
        size="sm"
        disabled={isPending || reason.trim().length < 3}
        onClick={() => onReopen(taskId, reason.trim())}
      >
        Confirmar
      </Button>
      <Button variant="outline" size="sm" onClick={() => setReasonOpen(false)} disabled={isPending}>
        Cancelar
      </Button>
    </div>
  );
}

export function TasksClient({
  myTasks,
  overdueTasks,
  completedTasks,
}: {
  myTasks: TaskItem[];
  overdueTasks: TaskItem[];
  completedTasks: TaskItem[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"mine" | "overdue" | "completed">("mine");
  const [isPending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [repeatInterval, setRepeatInterval] = useState("1");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tasks = view === "mine" ? myTasks : view === "overdue" ? overdueTasks : completedTasks;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const task = await createTask({
          title: newTitle,
          dueAt: newDueAt ? new Date(newDueAt).toISOString() : undefined,
        });
        if (repeatEnabled) {
          await setTaskRecurrence(task.id, {
            frequency: repeatFrequency,
            interval: Number(repeatInterval) || 1,
            until: repeatUntil ? new Date(repeatUntil).toISOString() : undefined,
          });
        }
        setNewTitle("");
        setNewDueAt("");
        setRepeatEnabled(false);
        setRepeatUntil("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar tarefa.");
      }
    });
  }

  function handleComplete(taskId: string) {
    startTransition(async () => {
      try {
        await completeTask(taskId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao concluir tarefa.");
      }
    });
  }

  function handleReopen(taskId: string, reason: string) {
    startTransition(async () => {
      try {
        await reopenTask(taskId, { reason });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao reabrir tarefa.");
      }
    });
  }

  return (
    <div className="p-4 md:p-8 flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare size={24} className="text-orange-600" />
            Tarefas
          </h1>
          <p className="text-slate-500 mt-1">O que precisa ser feito.</p>
        </div>
        <Link href="/crm/tarefas/calendario">
          <Button variant="outline">
            <CalendarDays size={18} /> Calendário
          </Button>
        </Link>
      </div>

      <form onSubmit={handleCreate} className="mb-6 space-y-2">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nova tarefa..."
            required
            className="flex-1"
          />
          <Input
            type="datetime-local"
            value={newDueAt}
            onChange={(e) => setNewDueAt(e.target.value)}
            className="w-auto"
          />
          <Button type="submit" disabled={isPending}>
            <Plus size={18} /> Adicionar
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={repeatEnabled}
            onChange={(e) => setRepeatEnabled(e.target.checked)}
          />
          Repetir
        </label>

        {repeatEnabled && (
          <div className="flex flex-wrap items-center gap-2 pl-6">
            <Select
              value={repeatFrequency}
              onChange={(e) => setRepeatFrequency(e.target.value as typeof repeatFrequency)}
              className="w-auto text-sm"
            >
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
            </Select>
            <span className="text-sm text-slate-500">a cada</span>
            <Input
              type="number"
              min={1}
              max={365}
              value={repeatInterval}
              onChange={(e) => setRepeatInterval(e.target.value)}
              className="w-16"
            />
            <span className="text-sm text-slate-500">até (opcional)</span>
            <Input
              type="date"
              value={repeatUntil}
              onChange={(e) => setRepeatUntil(e.target.value)}
              className="w-auto"
            />
          </div>
        )}
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setView("mine")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            view === "mine" ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Minhas tarefas ({myTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setView("overdue")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            view === "overdue" ? "bg-red-600 text-white" : "bg-slate-100 text-red-700"
          }`}
        >
          Atrasadas ({overdueTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setView("completed")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            view === "completed" ? "bg-green-700 text-white" : "bg-slate-100 text-green-700"
          }`}
        >
          Concluídas ({completedTasks.length})
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {tasks.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Nenhuma tarefa por aqui.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {task.opportunity?.title && `${task.opportunity.title} • `}
                  {task.dueAt
                    ? format(new Date(task.dueAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "Sem prazo"}
                </p>
              </div>
              {view === "completed" ? (
                <ReopenControl taskId={task.id} isPending={isPending} onReopen={handleReopen} />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleComplete(task.id)}
                  disabled={isPending}
                  className="text-green-700 hover:bg-green-50"
                >
                  Concluir
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
