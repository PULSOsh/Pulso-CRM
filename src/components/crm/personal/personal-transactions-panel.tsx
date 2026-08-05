"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createPersonalCategory } from "@/server/actions/personal-categories";
import type { getPersonalTransactions } from "@/server/actions/personal-transactions";
import {
  createPersonalTransaction,
  deletePersonalTransaction,
} from "@/server/actions/personal-transactions";

type Transaction = Awaited<ReturnType<typeof getPersonalTransactions>>[number];
type Account = { id: string; name: string };
type Category = { id: string; name: string; kind: "income" | "expense" };
type Card = { id: string; name: string };

const KIND_LABELS: Record<string, string> = {
  income: "Receita",
  expense: "Despesa",
  transfer_in: "Transferência (entrada)",
  transfer_out: "Transferência (saída)",
};

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

export function PersonalTransactionsPanel({
  transactions,
  accounts,
  categories,
  cards,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  cards: Card[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [installments, setInstallments] = useState("1");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.kind === kind);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPersonalTransaction({
          kind,
          accountId: accountId || undefined,
          categoryId: categoryId || undefined,
          creditCardId: creditCardId || undefined,
          amount: Number(amount),
          occurredAt,
          description,
          installments: Number(installments) || 1,
        });
        setAmount("");
        setDescription("");
        setInstallments("1");
        setCreating(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar lançamento.");
      }
    });
  }

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createPersonalCategory({ name: newCategoryName, kind });
        setNewCategoryName("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar categoria.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePersonalTransaction(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Receitas e despesas</h2>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          Novo lançamento
        </Button>
      </div>

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
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Conta (opcional)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Categoria (opcional)</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {kind === "expense" && (
              <Select value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)}>
                <option value="">Sem cartão</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <Input
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="number"
              step="0.01"
              placeholder="Valor total"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
            />
            <Input
              type="number"
              min="1"
              max="60"
              placeholder="Parcelas (1 = à vista)"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar
          </Button>
        </form>
      )}

      <form onSubmit={handleCreateCategory} className="flex gap-2 items-end">
        <div className="flex-1">
          <label htmlFor="new-category" className="text-xs text-slate-500">
            Nova categoria de {kind === "income" ? "receita" : "despesa"}
          </label>
          <Input
            id="new-category"
            placeholder="Nome da categoria"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={isPending || !newCategoryName}>
          Criar categoria
        </Button>
      </form>

      {transactions.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum lançamento ainda.</p>
      ) : (
        <ul className="space-y-2">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-control border border-pulso-border p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {t.description}
                  {t.installmentTotal && (
                    <span className="ml-2 text-xs text-slate-500">
                      {t.installmentNumber}/{t.installmentTotal}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(t.occurredAt).toLocaleDateString("pt-BR")} ·{" "}
                  {KIND_LABELS[t.kind] ?? t.kind}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-semibold ${
                    t.kind === "income" || t.kind === "transfer_in"
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {currency(t.amount)}
                </span>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)}>
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
