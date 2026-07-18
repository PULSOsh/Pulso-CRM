"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { getReceivables } from "@/server/actions/finance";
import { markInstallmentPaid, reverseInstallmentPayment } from "@/server/actions/finance";

type Receivable = Awaited<ReturnType<typeof getReceivables>>[number];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  due_soon: "Vence em breve",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  due_soon: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-500",
};

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

function InstallmentRow({ installment }: { installment: Receivable["installments"][number] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [payMode, setPayMode] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [amount, setAmount] = useState(installment.amount);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await markInstallmentPaid(installment.id, { paidAmount: Number(amount) });
        setPayMode(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao dar baixa.");
      }
    });
  }

  function handleReverse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await reverseInstallmentPayment(installment.id, reason);
        setReverseMode(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao estornar.");
      }
    });
  }

  return (
    <li className="rounded-control border border-pulso-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            Parcela {installment.installmentNumber} — {currency(installment.amount)}
          </p>
          <p className="text-xs text-slate-500">
            Vence em {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STATUS_STYLES[installment.status] ?? "bg-slate-100 text-slate-700"
            }`}
          >
            {STATUS_LABELS[installment.status] ?? installment.status}
          </span>
          {(installment.status === "pending" || installment.status === "overdue") && (
            <Button type="button" size="sm" variant="outline" onClick={() => setPayMode((v) => !v)}>
              Dar baixa
            </Button>
          )}
          {installment.status === "paid" && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setReverseMode((v) => !v)}
            >
              Estornar
            </Button>
          )}
        </div>
      </div>

      {payMode && (
        <form onSubmit={handlePay} className="mt-3 flex items-end gap-2">
          <div>
            <label htmlFor={`amount-${installment.id}`} className="text-xs text-slate-500">
              Valor recebido
            </label>
            <Input
              id={`amount-${installment.id}`}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-40"
            />
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            Confirmar
          </Button>
        </form>
      )}

      {reverseMode && (
        <form onSubmit={handleReverse} className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor={`reason-${installment.id}`} className="text-xs text-slate-500">
              Motivo do estorno
            </label>
            <Input
              id={`reason-${installment.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="sm" variant="destructive" disabled={isPending}>
            Confirmar estorno
          </Button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}

export function FinanceClient({ receivables }: { receivables: Receivable[] }) {
  const openTotal = receivables
    .flatMap((r) => r.installments)
    .filter((i) => i.status === "pending" || i.status === "due_soon")
    .reduce((acc, i) => acc + Number(i.amount), 0);
  const overdueTotal = receivables
    .flatMap((r) => r.installments)
    .filter((i) => i.status === "overdue")
    .reduce((acc, i) => acc + Number(i.amount), 0);
  const paidTotal = receivables
    .flatMap((r) => r.installments)
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + Number(i.paidAmount ?? i.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Em aberto</p>
          <p className="text-xl font-bold text-slate-900">{currency(openTotal)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Vencido</p>
          <p className="text-xl font-bold text-red-600">{currency(overdueTotal)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Recebido</p>
          <p className="text-xl font-bold text-emerald-600">{currency(paidTotal)}</p>
        </div>
      </div>

      {receivables.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum recebível gerado ainda.</p>
      ) : (
        <div className="space-y-4">
          {receivables.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-slate-900">{r.description}</p>
                  {(r.company || r.contact) && (
                    <p className="text-xs text-slate-500">
                      {r.company?.tradeName ||
                        `${r.contact?.firstName} ${r.contact?.lastName ?? ""}`}
                    </p>
                  )}
                </div>
                <p className="font-bold text-slate-900">{currency(r.totalAmount)}</p>
              </div>
              <ul className="space-y-2">
                {r.installments.map((installment) => (
                  <InstallmentRow key={installment.id} installment={installment} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
