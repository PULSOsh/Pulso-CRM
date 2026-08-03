"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";

type CalendarTask = {
  id: string;
  title: string;
  priority: string;
  dueAt: string | null;
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-500",
  low: "bg-slate-400",
};

export function CalendarClient({
  tasks,
  year,
  month,
}: {
  tasks: CalendarTask[];
  year: number;
  month: number;
}) {
  const refDate = new Date(year, month - 1, 1);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(refDate), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(refDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [refDate]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
      if (!task.dueAt) continue;
      const key = format(new Date(task.dueAt), "yyyy-MM-dd");
      const existing = map.get(key) ?? [];
      existing.push(task);
      map.set(key, existing);
    }
    return map;
  }, [tasks]);

  const prev = subMonths(refDate, 1);
  const next = addMonths(refDate, 1);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900 capitalize">
          {format(refDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Link href={`/crm/tarefas/calendario?year=${prev.getFullYear()}&month=${prev.getMonth() + 1}`}>
            <Button variant="outline" size="icon" title="Mês anterior">
              <ChevronLeft size={16} />
            </Button>
          </Link>
          <Link href={`/crm/tarefas/calendario?year=${next.getFullYear()}&month=${next.getMonth() + 1}`}>
            <Button variant="outline" size="icon" title="Próximo mês">
              <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden text-xs font-medium text-slate-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="bg-slate-50 p-2 text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-t-0 border-slate-200 rounded-b-lg overflow-hidden flex-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, refDate);

          return (
            <div
              key={key}
              className={`bg-white p-2 min-h-[90px] flex flex-col gap-1 ${
                inMonth ? "" : "bg-slate-50 text-slate-400"
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isToday(day) ? "inline-flex w-5 h-5 items-center justify-center rounded-full bg-orange-600 text-white" : ""
                }`}
              >
                {format(day, "d")}
              </span>
              {dayTasks.slice(0, 3).map((task) => (
                <span key={task.id} className="flex items-center gap-1 text-[11px] text-slate-700 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? "bg-slate-400"}`} />
                  <span className="truncate">{task.title}</span>
                </span>
              ))}
              {dayTasks.length > 3 && (
                <span className="text-[11px] text-slate-400">+{dayTasks.length - 3} mais</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
