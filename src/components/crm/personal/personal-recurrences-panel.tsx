"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createPersonalRecurrence,
  deactivatePersonalRecurrence,
  generateNextPersonalOccurrence,
} from "@/server/actions/personal-recurrences";

type Rule = {
  id: string;
  kind: "income" | "expense" | "transfer_in" | "transfer_out";
  frequency: "daily" | "weekly" | "monthly";
  description: string;
  amount: string;
  nextRunDate: string | Date;
  isActive: boolean;
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
};

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

export function PersonalRecurrencesPanel({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPersonalRecurrence({
          kind,
          frequency,
          description,
          amount: Number(amount),
          startDate,
        });
        setDescription("");
        setAmount("");
        setStartDate("");
        setCreating(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar regra.");
      }
    });
  }

  function handleGenerate(ruleId: string) {
    startTransition(async () => {
      try {
        await generateNextPersonalOccurrence(ruleId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao gerar ocorrência.");
      }
    });
  }

  function handleDeactivate(ruleId: string) {
    startTransition(async () => {
      await deactivatePersonalRecurrence(ruleId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Recorrências</h2>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          Nova regra
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        Sem automação agendada — gere a próxima ocorrência manualmente quando quiser lançar a
        parcela do período.
      </p>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={kind} onChange={(e) => setKind(e.target.value as "income" | "expense")}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </Select>
            <Select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as "daily" | "weekly" | "monthly")}
            >
              <option value="monthly">Mensal</option>
              <option value="weekly">Semanal</option>
              <option value="daily">Diária</option>
            </Select>
          </div>
          <Input
            placeholder="Descrição (ex.: Assinatura de streaming)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar
          </Button>
        </form>
      )}

      {rules.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma regra de recorrência cadastrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between rounded-control border border-pulso-border p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {rule.description} — {currency(rule.amount)}
                </p>
                <p className="text-xs text-slate-500">
                  {rule.kind === "expense" ? "Despesa" : "Receita"} ·{" "}
                  {FREQUENCY_LABELS[rule.frequency]} · Próxima:{" "}
                  {new Date(rule.nextRunDate).toLocaleDateString("pt-BR")}
                  {!rule.isActive && " · Desativada"}
                </p>
              </div>
              {rule.isActive && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerate(rule.id)}
                    disabled={isPending}
                  >
                    Gerar próxima
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeactivate(rule.id)}>
                    Desativar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
