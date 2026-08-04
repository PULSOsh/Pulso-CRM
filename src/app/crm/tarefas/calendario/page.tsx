import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { CalendarClient } from "@/components/crm/tasks/calendar-client";
import { getMilestonesForMonth } from "@/server/actions/milestones";
import { getTasksForMonth } from "@/server/actions/tasks";
import { auth } from "@/server/auth";

export default async function TarefasCalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { year: yearParam, month: monthParam } = await searchParams;
  const now = new Date();
  const year = Number(yearParam) || now.getFullYear();
  const month = Number(monthParam) || now.getMonth() + 1; // 1-12

  const refDate = new Date(year, month - 1, 1);
  const gridStart = startOfWeek(startOfMonth(refDate), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(refDate), { weekStartsOn: 0 });

  const [tasks, milestones] = await Promise.all([
    getTasksForMonth(gridStart.toISOString(), gridEnd.toISOString()),
    getMilestonesForMonth(gridStart.toISOString(), gridEnd.toISOString()),
  ]);

  const serializedTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
  }));

  const serializedMilestones = milestones.map((m) => ({
    id: m.id,
    title: `${m.title} (${m.projectName})`,
    dueAt: m.dueDate ? m.dueDate.toISOString() : null,
    href: `/crm/projetos/${m.projectId}`,
  }));

  return (
    <AppShell active="tasks" eyebrow="OPERAÇÃO" title="Calendário de Tarefas">
      <CalendarClient tasks={serializedTasks} milestones={serializedMilestones} year={year} month={month} />
    </AppShell>
  );
}
