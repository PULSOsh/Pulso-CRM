"use client";

import { Loader2, Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOpportunity } from "@/server/actions/pipeline";

type Opportunity = {
  id: string;
  title: string;
  description: string | null;
  source: string | null;
  status: string;
  estimatedValue: string;
  negotiatedValue: string | null;
  probability: number | null;
  expectedCloseDate: Date | null;
};

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function OpportunityNegotiationForm({ opportunity }: { opportunity: Opportunity }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(opportunity.title);
  const [description, setDescription] = useState(opportunity.description ?? "");
  const [source, setSource] = useState(opportunity.source ?? "");
  const [estimatedValue, setEstimatedValue] = useState(opportunity.estimatedValue);
  const [negotiatedValue, setNegotiatedValue] = useState(opportunity.negotiatedValue ?? "");
  const [probability, setProbability] = useState(opportunity.probability?.toString() ?? "");
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    toDateInputValue(opportunity.expectedCloseDate),
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateOpportunity(opportunity.id, {
          title,
          description,
          source,
          estimatedValue: estimatedValue === "" ? undefined : Number(estimatedValue),
          negotiatedValue: negotiatedValue === "" ? undefined : Number(negotiatedValue),
          probability: probability === "" ? undefined : Number(probability),
          expectedCloseDate: expectedCloseDate || "",
        });
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  if (!editing) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Informações da Negociação</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            <Pencil size={14} /> Editar
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">Valor Estimado</span>
            <span className="font-semibold text-slate-900">
              {currency(Number(opportunity.estimatedValue))}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">Valor Negociado</span>
            <span className="font-semibold text-slate-900">
              {opportunity.negotiatedValue ? currency(Number(opportunity.negotiatedValue)) : "-"}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">Probabilidade</span>
            <span className="font-semibold text-slate-900">
              {opportunity.probability != null ? `${opportunity.probability}%` : "-"}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">Previsão de fechamento</span>
            <span className="font-semibold text-slate-900">
              {opportunity.expectedCloseDate
                ? new Date(opportunity.expectedCloseDate).toLocaleDateString("pt-BR")
                : "-"}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">Status</span>
            <span className="font-semibold text-slate-900 capitalize">{opportunity.status}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-4">
            <span className="text-slate-500">Origem</span>
            <span className="font-semibold text-slate-900">{opportunity.source || "-"}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-2">Diagnóstico</span>
            <p className="text-slate-700 text-sm whitespace-pre-wrap">
              {opportunity.description || "Nenhum diagnóstico registrado ainda."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Editar negociação</h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-slate-400 hover:text-slate-700"
          disabled={isPending}
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="opp-title" className="text-sm font-medium text-slate-700">
            Título
          </label>
          <input
            id="opp-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="opp-estimated" className="text-sm font-medium text-slate-700">
              Valor Estimado (R$)
            </label>
            <input
              id="opp-estimated"
              type="number"
              step="0.01"
              min="0"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              className="mt-1 w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
            />
          </div>
          <div>
            <label htmlFor="opp-negotiated" className="text-sm font-medium text-slate-700">
              Valor Negociado (R$)
            </label>
            <input
              id="opp-negotiated"
              type="number"
              step="0.01"
              min="0"
              value={negotiatedValue}
              onChange={(e) => setNegotiatedValue(e.target.value)}
              className="mt-1 w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="opp-probability" className="text-sm font-medium text-slate-700">
              Probabilidade (%)
            </label>
            <input
              id="opp-probability"
              type="number"
              min="0"
              max="100"
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              className="mt-1 w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
            />
          </div>
          <div>
            <label htmlFor="opp-close-date" className="text-sm font-medium text-slate-700">
              Previsão de fechamento
            </label>
            <input
              id="opp-close-date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="mt-1 w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="opp-source" className="text-sm font-medium text-slate-700">
            Origem
          </label>
          <input
            id="opp-source"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Indicação, site, evento..."
            className="mt-1 w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
          />
        </div>

        <div>
          <label htmlFor="opp-description" className="text-sm font-medium text-slate-700">
            Diagnóstico
          </label>
          <textarea
            id="opp-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="O que o cliente precisa, dores identificadas, contexto..."
            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={isPending}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
        </div>
      </div>
    </form>
  );
}
