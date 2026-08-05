"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { getPayables } from "@/server/actions/payables";
import {
  createPayable,
  markPayableInstallmentPaid,
  reversePayableInstallmentPayment,
} from "@/server/actions/payables";

type Payable = Awaited<ReturnType<typeof getPayables>>[number];
type Vendor = { id: string; tradeName: string };
type Category = { id: string; name: string };
type CostCenter = { id: string; name: string };
type Account = { id: string; name: string };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  due_soon: "Vence em breve",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
  partially_paid: "Parcialmente pago",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  due_soon: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-500",
  partially_paid: "bg-blue-100 text-blue-800",
};

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

function InstallmentRow({
  installment,
  accounts,
}: {
  installment: Payable["installments"][number];
  accounts: Account[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [payMode, setPayMode] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const remaining = Number(installment.amount) - Number(installment.paidAmount ?? 0);
  const [amount, setAmount] = useState(String(remaining.toFixed(2)));
  const [accountId, setAccountId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await markPayableInstallmentPaid(installment.id, {
          paidAmount: Number(amount),
          accountId: accountId || undefined,
        });
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
        await reversePayableInstallmentPayment(installment.id, reason);
        setReverseMode(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao estornar.");
      }
    });
  }

  const canPay = ["pending", "overdue", "due_soon", "partially_paid"].includes(installment.status);
  const hasPayment = Number(installment.paidAmount ?? 0) > 0;

  return (
    <li className="rounded-control border border-pulso-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            Parcela {installment.installmentNumber} — {currency(installment.amount)}
          </p>
          <p className="text-xs text-slate-500">
            Vence em {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
            {hasPayment && ` · Pago: ${currency(installment.paidAmount ?? 0)}`}
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
          {canPay && (
            <Button type="button" size="sm" variant="outline" onClick={() => setPayMode((v) => !v)}>
              Dar baixa
            </Button>
          )}
          {hasPayment && (
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
        <form onSubmit={handlePay} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor={`amount-${installment.id}`} className="text-xs text-slate-500">
              Valor pago
            </label>
            <Input
              id={`amount-${installment.id}`}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-32"
            />
          </div>
          <div>
            <label htmlFor={`account-${installment.id}`} className="text-xs text-slate-500">
              Conta
            </label>
            <Select
              id={`account-${installment.id}`}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-40"
            >
              <option value="">Sem conta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
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

export function PayablesPanel({
  payables,
  vendors,
  categories,
  costCenters,
  accounts,
}: {
  payables: Payable[];
  vendors: Vendor[];
  categories: Category[];
  costCenters: CostCenter[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [description, setDescription] = useState("");
  const [vendorCompanyId, setVendorCompanyId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [rows, setRows] = useState<{ key: string; amount: number; dueDate: string }[]>([
    { key: crypto.randomUUID(), amount: 0, dueDate: "" },
  ]);
  const [error, setError] = useState<string | null>(null);

  const openTotal = payables
    .flatMap((p) => p.installments)
    .filter((i) => ["pending", "due_soon", "partially_paid"].includes(i.status))
    .reduce((acc, i) => acc + (Number(i.amount) - Number(i.paidAmount ?? 0)), 0);
  const overdueTotal = payables
    .flatMap((p) => p.installments)
    .filter((i) => i.status === "overdue")
    .reduce((acc, i) => acc + (Number(i.amount) - Number(i.paidAmount ?? 0)), 0);
  const paidTotal = payables
    .flatMap((p) => p.installments)
    .reduce((acc, i) => acc + Number(i.paidAmount ?? 0), 0);

  function updateRow(key: string, field: "amount" | "dueDate", value: string | number) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPayable({
          description,
          vendorCompanyId: vendorCompanyId || undefined,
          categoryId: categoryId || undefined,
          costCenterId: costCenterId || undefined,
          installmentsPlan: rows.map((r) => ({ amount: Number(r.amount), dueDate: r.dueDate })),
        });
        setDescription("");
        setVendorCompanyId("");
        setCategoryId("");
        setCostCenterId("");
        setRows([{ key: crypto.randomUUID(), amount: 0, dueDate: "" }]);
        setCreating(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar conta a pagar.");
      }
    });
  }

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
          <p className="text-sm text-slate-500">Pago</p>
          <p className="text-xl font-bold text-emerald-600">{currency(paidTotal)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          Nova conta a pagar
        </Button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <Input
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={vendorCompanyId} onChange={(e) => setVendorCompanyId(e.target.value)}>
              <option value="">Fornecedor (opcional)</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.tradeName}
                </option>
              ))}
            </Select>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Categoria (opcional)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select value={costCenterId} onChange={(e) => setCostCenterId(e.target.value)}>
              <option value="">Centro de custo (opcional)</option>
              {costCenters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500">Parcelas</span>
            {rows.map((row) => (
              <div key={row.key} className="flex items-end gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={row.amount}
                  onChange={(e) => updateRow(row.key, "amount", Number(e.target.value))}
                  className="w-32"
                  required
                />
                <Input
                  type="date"
                  value={row.dueDate}
                  onChange={(e) => updateRow(row.key, "dueDate", e.target.value)}
                  required
                />
                {rows.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                  >
                    Remover
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setRows((prev) => [...prev, { key: crypto.randomUUID(), amount: 0, dueDate: "" }])
              }
            >
              Adicionar parcela
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar
          </Button>
        </form>
      )}

      {payables.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma conta a pagar cadastrada ainda.</p>
      ) : (
        <div className="space-y-4">
          {payables.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-slate-900">{p.description}</p>
                  {p.vendor && <p className="text-xs text-slate-500">{p.vendor.tradeName}</p>}
                </div>
                <p className="font-bold text-slate-900">{currency(p.totalAmount)}</p>
              </div>
              <ul className="space-y-2">
                {p.installments.map((installment) => (
                  <InstallmentRow
                    key={installment.id}
                    installment={installment}
                    accounts={accounts}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
