"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createFinancialAccount,
  deactivateFinancialAccount,
  updateFinancialAccount,
} from "@/server/actions/financial-accounts";
import { createFinancialTransfer } from "@/server/actions/financial-transfers";

type Account = {
  id: string;
  name: string;
  accountType: string | null;
  institution: string | null;
  isDefault: boolean;
  isActive: boolean;
};

export function AccountsPanel({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createFinancialAccount({ name, institution });
        setName("");
        setInstitution("");
        setCreating(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar conta.");
      }
    });
  }

  function handleSetDefault(accountId: string) {
    startTransition(async () => {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return;
      await updateFinancialAccount(accountId, { name: account.name, isDefault: true });
      router.refresh();
    });
  }

  function handleDeactivate(accountId: string) {
    startTransition(async () => {
      await deactivateFinancialAccount(accountId);
      router.refresh();
    });
  }

  function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createFinancialTransfer({
          fromAccountId,
          toAccountId,
          amount: Number(transferAmount),
        });
        setTransferAmount("");
        setTransferring(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao transferir.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Contas financeiras</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setTransferring((v) => !v)}>
            Transferir entre contas
          </Button>
          <Button size="sm" onClick={() => setCreating((v) => !v)}>
            Nova conta
          </Button>
        </div>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <Input
            placeholder="Nome (ex.: Banco Inter)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            placeholder="Instituição (opcional)"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar
          </Button>
        </form>
      )}

      {transferring && (
        <form
          onSubmit={handleTransfer}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              required
            >
              <option value="">Conta de origem</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
              <option value="">Conta de destino</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            Confirmar transferência
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {accounts.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma conta financeira cadastrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between rounded-control border border-pulso-border p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {account.name}
                  {account.isDefault && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                      Padrão
                    </span>
                  )}
                  {!account.isActive && (
                    <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">
                      Inativa
                    </span>
                  )}
                </p>
                {account.institution && (
                  <p className="text-xs text-slate-500">{account.institution}</p>
                )}
              </div>
              {account.isActive && (
                <div className="flex gap-2">
                  {!account.isDefault && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetDefault(account.id)}>
                      Tornar padrão
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDeactivate(account.id)}>
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
