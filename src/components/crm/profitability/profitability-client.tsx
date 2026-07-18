"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  getBusinessProfitability,
  getPersonalProfitability,
} from "@/server/actions/profitability";
import { createExpense, updateFinancialSettings } from "@/server/actions/profitability";

function currency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function months(value: number | null) {
  if (value === null) return "—";
  return `${value.toFixed(1)} meses`;
}

export function ProfitabilityClient({
  business,
  personal,
  settings,
}: {
  business: Awaited<ReturnType<typeof getBusinessProfitability>>;
  personal: Awaited<ReturnType<typeof getPersonalProfitability>> | null;
  settings: {
    monthlyPersonalNeed: number;
    businessCashBalance: number;
    personalCashBalance: number;
    monthlyCapacityHours: number;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [expenseScope, setExpenseScope] = useState<"personal" | "business" | "project">("business");
  const [expenseType, setExpenseType] = useState("fixed");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [settingsForm, setSettingsForm] = useState(settings);

  function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createExpense({
          scope: expenseScope,
          type: expenseType as Parameters<typeof createExpense>[0]["type"],
          description: expenseDescription,
          amount: expenseAmount,
          competenceDate: expenseDate,
        });
        setExpenseDescription("");
        setExpenseAmount(0);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao lançar despesa.");
      }
    });
  }

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateFinancialSettings(settingsForm);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar configuração.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-lg text-slate-900 mb-4">Empresarial</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Custo fixo" value={currency(business.fixedCost)} />
          <Metric label="Custos variáveis" value={currency(business.variableCosts)} />
          <Metric label="Receita contratada" value={currency(business.contractedRevenue)} />
          <Metric label="Receita recebida" value={currency(business.receivedRevenue)} />
          <Metric label="Margem de contribuição" value={currency(business.contributionMargin)} />
          <Metric label="Resultado operacional" value={currency(business.operationalResult)} />
          <Metric label="Ponto de equilíbrio" value={currency(business.breakEvenRevenue)} />
          <Metric label="Runway empresarial" value={months(business.businessRunwayMonths)} />
        </div>
      </section>

      {personal && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-1">Pessoal</h2>
          <p className="text-xs text-slate-500 mb-4">Visível apenas ao fundador (owner).</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Necessidade pessoal" value={currency(personal.personalNeed)} />
            <Metric label="Custo total de sustentação" value={currency(personal.sustainingCost)} />
            <Metric label="Resultado disponível" value={currency(personal.availableResult)} />
            <Metric label="Meta mínima" value={currency(personal.minimumTarget)} />
            <Metric label="Meta segura" value={currency(personal.safeTarget)} />
            <Metric label="Meta de crescimento" value={currency(personal.growthTarget)} />
            <Metric
              label="Meta proporcional (hoje)"
              value={currency(personal.proportionalGoalToday)}
            />
            <Metric label="Runway pessoal" value={months(personal.personalRunwayMonths)} />
            <Metric
              label="Valor-hora mínimo"
              value={
                personal.minimumHourlyRate === null
                  ? "—"
                  : `${currency(personal.minimumHourlyRate)}/h`
              }
            />
          </div>
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-lg text-slate-900 mb-4">Lançar despesa</h2>
        <form
          onSubmit={handleCreateExpense}
          className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label htmlFor="expense-scope" className="text-xs text-slate-500">
              Escopo
            </label>
            <Select
              id="expense-scope"
              value={expenseScope}
              onChange={(e) => setExpenseScope(e.target.value as typeof expenseScope)}
            >
              <option value="business">Empresarial</option>
              <option value="personal">Pessoal</option>
              <option value="project">Projeto</option>
            </Select>
          </div>
          <div>
            <label htmlFor="expense-type" className="text-xs text-slate-500">
              Tipo
            </label>
            <Select
              id="expense-type"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
            >
              <option value="fixed">Fixo</option>
              <option value="variable">Variável</option>
              <option value="investment">Investimento</option>
              <option value="pro_labore">Pró-labore</option>
              <option value="withdrawal">Retirada</option>
              <option value="distribution">Distribuição</option>
              <option value="reimbursement">Reembolso</option>
              <option value="contribution">Aporte</option>
              <option value="personal_paid_by_company">Pessoal pago pela empresa</option>
            </Select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="expense-description" className="text-xs text-slate-500">
              Descrição
            </label>
            <Input
              id="expense-description"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="expense-amount" className="text-xs text-slate-500">
              Valor
            </label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label htmlFor="expense-date" className="text-xs text-slate-500">
              Competência
            </label>
            <Input
              id="expense-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isPending} className="col-span-2 md:col-span-1">
            Lançar
          </Button>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-lg text-slate-900 mb-1">Configuração</h2>
        <p className="text-xs text-slate-500 mb-4">
          Saldo em caixa e capacidade de horas — usados no cálculo de runway e valor-hora mínimo, já
          que o sistema não tem integração bancária.
        </p>
        <form
          onSubmit={handleSaveSettings}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label htmlFor="settings-need" className="text-xs text-slate-500">
              Necessidade pessoal mensal
            </label>
            <Input
              id="settings-need"
              type="number"
              step="0.01"
              value={settingsForm.monthlyPersonalNeed}
              onChange={(e) =>
                setSettingsForm((s) => ({ ...s, monthlyPersonalNeed: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <label htmlFor="settings-business-cash" className="text-xs text-slate-500">
              Caixa empresarial
            </label>
            <Input
              id="settings-business-cash"
              type="number"
              step="0.01"
              value={settingsForm.businessCashBalance}
              onChange={(e) =>
                setSettingsForm((s) => ({ ...s, businessCashBalance: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <label htmlFor="settings-personal-cash" className="text-xs text-slate-500">
              Caixa pessoal
            </label>
            <Input
              id="settings-personal-cash"
              type="number"
              step="0.01"
              value={settingsForm.personalCashBalance}
              onChange={(e) =>
                setSettingsForm((s) => ({ ...s, personalCashBalance: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <label htmlFor="settings-hours" className="text-xs text-slate-500">
              Capacidade mensal (horas)
            </label>
            <Input
              id="settings-hours"
              type="number"
              step="0.5"
              value={settingsForm.monthlyCapacityHours}
              onChange={(e) =>
                setSettingsForm((s) => ({ ...s, monthlyCapacityHours: Number(e.target.value) }))
              }
            />
          </div>
          <Button type="submit" disabled={isPending} className="col-span-2 md:col-span-1">
            Salvar
          </Button>
        </form>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
