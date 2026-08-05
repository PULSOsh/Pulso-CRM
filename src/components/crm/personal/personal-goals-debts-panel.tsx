"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  contributeToPersonalGoal,
  createPersonalDebt,
  createPersonalGoal,
  payPersonalDebt,
} from "@/server/actions/personal-goals";

type Goal = {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | Date | null;
};
type Debt = {
  id: string;
  name: string;
  totalAmount: string;
  remainingAmount: string;
  status: "open" | "paid" | "cancelled";
  dueDate: string | Date | null;
};

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contributing, setContributing] = useState(false);
  const [amount, setAmount] = useState("");
  const progress = Math.min(100, (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100);

  function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await contributeToPersonalGoal(goal.id, { amount: Number(amount) });
      setAmount("");
      setContributing(false);
      router.refresh();
    });
  }

  return (
    <li className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">{goal.name}</p>
        <Button size="sm" variant="outline" onClick={() => setContributing((v) => !v)}>
          Contribuir
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        {currency(goal.currentAmount)} de {currency(goal.targetAmount)}
        {goal.targetDate && ` · até ${new Date(goal.targetDate).toLocaleDateString("pt-BR")}`}
      </p>
      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-pulso-signal" style={{ width: `${progress}%` }} />
      </div>
      {contributing && (
        <form onSubmit={handleContribute} className="mt-3 flex items-end gap-2">
          <Input
            type="number"
            step="0.01"
            placeholder="Valor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32"
            required
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Confirmar
          </Button>
        </form>
      )}
    </li>
  );
}

function DebtRow({ debt }: { debt: Debt }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState("");

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await payPersonalDebt(debt.id, { amount: Number(amount) });
      setAmount("");
      setPaying(false);
      router.refresh();
    });
  }

  return (
    <li className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">{debt.name}</p>
        {debt.status === "paid" ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Quitada
          </span>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setPaying((v) => !v)}>
            Pagar
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Restante {currency(debt.remainingAmount)} de {currency(debt.totalAmount)}
        {debt.dueDate && ` · vence ${new Date(debt.dueDate).toLocaleDateString("pt-BR")}`}
      </p>
      {paying && (
        <form onSubmit={handlePay} className="mt-3 flex items-end gap-2">
          <Input
            type="number"
            step="0.01"
            placeholder="Valor pago"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32"
            required
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Confirmar
          </Button>
        </form>
      )}
    </li>
  );
}

export function PersonalGoalsDebtsPanel({ goals, debts }: { goals: Goal[]; debts: Debt[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [creatingDebt, setCreatingDebt] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [debtName, setDebtName] = useState("");
  const [debtTotal, setDebtTotal] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPersonalGoal({
          name: goalName,
          targetAmount: Number(goalTarget),
          targetDate: goalDate,
        });
        setGoalName("");
        setGoalTarget("");
        setGoalDate("");
        setCreatingGoal(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar meta.");
      }
    });
  }

  function handleCreateDebt(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPersonalDebt({
          name: debtName,
          totalAmount: Number(debtTotal),
          dueDate: debtDueDate,
        });
        setDebtName("");
        setDebtTotal("");
        setDebtDueDate("");
        setCreatingDebt(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar dívida.");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Metas</h2>
          <Button size="sm" onClick={() => setCreatingGoal((v) => !v)}>
            Nova meta
          </Button>
        </div>
        {creatingGoal && (
          <form
            onSubmit={handleCreateGoal}
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
          >
            <Input
              placeholder="Nome (ex.: Reserva de emergência)"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Valor-alvo"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              required
            />
            <Input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />
            <Button type="submit" size="sm" disabled={isPending}>
              Salvar
            </Button>
          </form>
        )}
        {goals.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma meta cadastrada ainda.</p>
        ) : (
          <ul className="space-y-2">
            {goals.map((g) => (
              <GoalRow key={g.id} goal={g} />
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Dívidas</h2>
          <Button size="sm" onClick={() => setCreatingDebt((v) => !v)}>
            Nova dívida
          </Button>
        </div>
        {creatingDebt && (
          <form
            onSubmit={handleCreateDebt}
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
          >
            <Input
              placeholder="Nome (ex.: Financiamento do carro)"
              value={debtName}
              onChange={(e) => setDebtName(e.target.value)}
              required
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Valor total"
              value={debtTotal}
              onChange={(e) => setDebtTotal(e.target.value)}
              required
            />
            <Input
              type="date"
              value={debtDueDate}
              onChange={(e) => setDebtDueDate(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={isPending}>
              Salvar
            </Button>
          </form>
        )}
        {debts.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma dívida cadastrada ainda.</p>
        ) : (
          <ul className="space-y-2">
            {debts.map((d) => (
              <DebtRow key={d.id} debt={d} />
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
    </div>
  );
}
