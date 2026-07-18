import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { TasksClient } from "@/components/crm/tasks/tasks-client";
import { getMyTasks, getOverdueTasks } from "@/server/actions/tasks";
import { auth } from "@/server/auth";

export default async function TarefasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const [myTasks, overdueTasks] = await Promise.all([getMyTasks(), getOverdueTasks()]);

  const serializedMyTasks = myTasks.map((t) => ({
    ...t,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
  }));
  const serializedOverdueTasks = overdueTasks.map((t) => ({
    ...t,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
  }));

  return (
    <AppShell active="tasks" eyebrow="OPERAÇÃO" title="Tarefas">
      <TasksClient myTasks={serializedMyTasks} overdueTasks={serializedOverdueTasks} />
    </AppShell>
  );
}
