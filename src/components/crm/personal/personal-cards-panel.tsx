"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPersonalCreditCard,
  getCreditCardInvoices,
  payPersonalInvoice,
} from "@/server/actions/personal-credit-cards";

type Card = { id: string; name: string; closingDay: number; dueDay: number };
type Invoice = Awaited<ReturnType<typeof getCreditCardInvoices>>[number];

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

function CardInvoices({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    startTransition(async () => {
      const result = await getCreditCardInvoices(cardId);
      setInvoices(result);
    });
  }

  function handlePay(referenceMonth: Date, total: number) {
    startTransition(async () => {
      try {
        await payPersonalInvoice(cardId, referenceMonth.toISOString(), { paidAmount: total });
        router.refresh();
        setInvoices(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao pagar fatura.");
      }
    });
  }

  if (invoices === null) {
    return (
      <Button size="sm" variant="ghost" onClick={load} disabled={isPending}>
        Ver faturas
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {invoices.map((inv) => (
        <div
          key={inv.referenceMonth.toString()}
          className="flex items-center justify-between rounded-control border border-pulso-border p-3"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">
              {new Date(inv.referenceMonth).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-slate-500">
              Vence em {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">{currency(inv.total)}</span>
            {inv.status === "paid" ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Paga
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePay(inv.referenceMonth, inv.total)}
                disabled={isPending || inv.total === 0}
              >
                Marcar como paga
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PersonalCardsPanel({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [closingDay, setClosingDay] = useState("1");
  const [dueDay, setDueDay] = useState("10");
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPersonalCreditCard({
          name,
          closingDay: Number(closingDay),
          dueDay: Number(dueDay),
        });
        setName("");
        setCreating(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar cartão.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Cartões de crédito</h2>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          Novo cartão
        </Button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <Input
            placeholder="Nome (ex.: Nubank)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="closing-day" className="text-xs text-slate-500">
                Dia de fechamento
              </label>
              <Input
                id="closing-day"
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="due-day" className="text-xs text-slate-500">
                Dia de vencimento
              </label>
              <Input
                id="due-day"
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar
          </Button>
        </form>
      )}

      {cards.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum cartão cadastrado ainda.</p>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => (
            <li key={card.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-900">{card.name}</p>
              <p className="text-xs text-slate-500">
                Fecha dia {card.closingDay}, vence dia {card.dueDay}
              </p>
              <CardInvoices cardId={card.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
