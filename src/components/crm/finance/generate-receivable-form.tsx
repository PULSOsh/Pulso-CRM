"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { getReceivableForContract, InstallmentInput } from "@/server/actions/finance";
import { createReceivableFromContract } from "@/server/actions/finance";

type ExistingReceivable = NonNullable<Awaited<ReturnType<typeof getReceivableForContract>>>;

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  due_soon: "Vence em breve",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

export function GenerateReceivableForm({
  contractId,
  existing,
  suggestedTotal,
}: {
  contractId: string;
  existing: ExistingReceivable | null;
  suggestedTotal: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [description, setDescription] = useState("Recebível do contrato");
  const [rows, setRows] = useState<(InstallmentInput & { key: string })[]>([
    { key: crypto.randomUUID(), amount: suggestedTotal ?? 0, dueDate: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  if (existing) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900 mb-4">
          Recebível — {currency(existing.receivable.totalAmount)}
        </h2>
        <ul className="space-y-1 text-sm">
          {existing.installments.map((i) => (
            <li key={i.id} className="flex justify-between">
              <span>
                Parcela {i.installmentNumber} — {new Date(i.dueDate).toLocaleDateString("pt-BR")}
              </span>
              <span className="text-slate-500">
                {currency(i.amount)} · {STATUS_LABELS[i.status] ?? i.status}
              </span>
            </li>
          ))}
        </ul>
        <a
          href="/crm/financeiro"
          className="mt-4 inline-block text-sm text-orange-600 hover:text-orange-700"
        >
          Gerenciar no Financeiro →
        </a>
      </div>
    );
  }

  function updateRow(key: string, field: keyof InstallmentInput, value: string | number) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  const total = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createReceivableFromContract(contractId, {
          description,
          installmentsPlan: rows.map((r) => ({ amount: Number(r.amount), dueDate: r.dueDate })),
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao gerar recebível.");
      }
    });
  }

  if (!creating) {
    return (
      <Button type="button" variant="outline" onClick={() => setCreating(true)}>
        Gerar recebível
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
    >
      <h2 className="font-semibold text-slate-900">Gerar recebível</h2>
      <div>
        <label htmlFor="receivable-description" className="text-sm font-medium text-slate-700">
          Descrição
        </label>
        <Input
          id="receivable-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Parcelas</p>
        {rows.map((row) => (
          <div key={row.key} className="flex items-end gap-2">
            <div>
              <label htmlFor={`row-amount-${row.key}`} className="text-xs text-slate-500">
                Valor
              </label>
              <Input
                id={`row-amount-${row.key}`}
                type="number"
                step="0.01"
                value={row.amount}
                onChange={(e) => updateRow(row.key, "amount", Number(e.target.value))}
                required
                className="w-32"
              />
            </div>
            <div>
              <label htmlFor={`row-due-${row.key}`} className="text-xs text-slate-500">
                Vencimento
              </label>
              <Input
                id={`row-due-${row.key}`}
                type="date"
                value={row.dueDate}
                onChange={(e) => updateRow(row.key, "dueDate", e.target.value)}
                required
              />
            </div>
            {rows.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setRows((prev) => [...prev, { key: crypto.randomUUID(), amount: 0, dueDate: "" }])
          }
        >
          <Plus size={16} /> Adicionar parcela
        </Button>
      </div>

      <p className="text-sm text-slate-600">
        Total: <span className="font-semibold">{currency(total)}</span>
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Gerando..." : "Confirmar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setCreating(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
