"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getPersonalBudgetReport, upsertPersonalBudget } from "@/server/actions/personal-budgets";

type Category = { id: string; name: string; kind: "income" | "expense" };
type BudgetRow = Awaited<ReturnType<typeof getPersonalBudgetReport>>[number];

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function PersonalBudgetPanel({
  categories,
  initialReport,
}: {
  categories: Category[];
  initialReport: BudgetRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState(initialReport);
  const [categoryId, setCategoryId] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.kind === "expense");

  function reload(newMonth: string) {
    startTransition(async () => {
      const result = await getPersonalBudgetReport(newMonth);
      setReport(result);
    });
  }

  function handleMonthChange(value: string) {
    setMonth(value);
    reload(value);
  }

  function handleSetBudget(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await upsertPersonalBudget({ month, categoryId, plannedAmount: Number(plannedAmount) });
        setPlannedAmount("");
        reload(month);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao definir orçamento.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Orçamento mensal</h2>
        <Input
          type="month"
          value={month.slice(0, 7)}
          onChange={(e) => handleMonthChange(`${e.target.value}-01`)}
          className="w-40"
        />
      </div>

      <form
        onSubmit={handleSetBudget}
        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-3"
      >
        <div>
          <label htmlFor="budget-category" className="text-xs text-slate-500">
            Categoria
          </label>
          <Select
            id="budget-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-48"
            required
          >
            <option value="">Selecione</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="budget-amount" className="text-xs text-slate-500">
            Valor planejado
          </label>
          <Input
            id="budget-amount"
            type="number"
            step="0.01"
            value={plannedAmount}
            onChange={(e) => setPlannedAmount(e.target.value)}
            className="w-32"
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          Definir
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {report.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum orçamento ou gasto neste mês ainda.</p>
      ) : (
        <ul className="space-y-2">
          {report.map((row) => (
            <li key={row.categoryId} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">{row.categoryName}</p>
                <p
                  className={`text-sm font-semibold ${row.remaining < 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {currency(row.remaining)} restante
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Realizado {currency(row.actual)} de {currency(row.planned)} planejado
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${row.actual > row.planned ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{
                    width: `${row.planned > 0 ? Math.min(100, (row.actual / row.planned) * 100) : 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
