"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeTask, createTask } from "@/server/actions/tasks";

type TaskItem = {
  id: string;
  title: string;
  dueAt: string | null;
  priority: string;
  opportunity: { title: string } | null;
};

export function TasksClient({
  myTasks,
  overdueTasks,
}: {
  myTasks: TaskItem[];
  overdueTasks: TaskItem[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"mine" | "overdue">("mine");
  const [isPending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tasks = view === "mine" ? myTasks : overdueTasks;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createTask({
          title: newTitle,
          dueAt: newDueAt ? new Date(newDueAt).toISOString() : undefined,
        });
        setNewTitle("");
        setNewDueAt("");
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
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleComplete(task.id)}
                disabled={isPending}
                className="text-green-700 hover:bg-green-50"
              >
                Concluir
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
