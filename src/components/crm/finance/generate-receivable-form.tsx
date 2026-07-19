"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
      <div className="builder-card">
        <strong style={{ fontSize: 15 }}>
          Recebível — {currency(existing.receivable.totalAmount)}
        </strong>
        <ul style={{ display: "grid", gap: 6, margin: "14px 0 0", padding: 0, listStyle: "none" }}>
          {existing.installments.map((i) => (
            <li
              key={i.id}
              style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
            >
              <span>
                Parcela {i.installmentNumber} — {new Date(i.dueDate).toLocaleDateString("pt-BR")}
              </span>
              <span className="muted">
                {currency(i.amount)} · {STATUS_LABELS[i.status] ?? i.status}
              </span>
            </li>
          ))}
        </ul>
        <a
          href="/crm/financeiro"
          style={{
            display: "inline-block",
            marginTop: 14,
            fontSize: 13,
            fontWeight: 650,
            color: "var(--signal-dark)",
          }}
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
      <button type="button" className="secondary-button" onClick={() => setCreating(true)}>
        Gerar recebível
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="builder-card" style={{ display: "grid", gap: 16 }}>
      <strong style={{ fontSize: 15 }}>Gerar recebível</strong>

      <label className="field">
        <span>Descrição</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>

      <div style={{ display: "grid", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 750 }}>Parcelas</span>
        {rows.map((row) => (
          <div key={row.key} style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <label className="field" style={{ width: 140 }}>
              <span>Valor</span>
              <input
                type="number"
                step="0.01"
                value={row.amount}
                onChange={(e) => updateRow(row.key, "amount", Number(e.target.value))}
                required
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>Vencimento</span>
              <input
                type="date"
                value={row.dueDate}
                onChange={(e) => updateRow(row.key, "dueDate", e.target.value)}
                required
              />
            </label>
            {rows.length > 1 && (
              <button
                type="button"
                className="icon-button"
                onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-action"
          style={{ marginTop: 0 }}
          onClick={() =>
            setRows((prev) => [...prev, { key: crypto.randomUUID(), amount: 0, dueDate: "" }])
          }
        >
          <Plus size={16} /> Adicionar parcela
        </button>
      </div>

      <p style={{ fontSize: 13, color: "var(--mineral)", margin: 0 }}>
        Total: <strong style={{ color: "var(--carbon)" }}>{currency(total)}</strong>
      </p>

      {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          {isPending ? "Gerando..." : "Confirmar"}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setCreating(false)}
          disabled={isPending}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
