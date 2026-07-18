"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { getProducts } from "@/server/actions/products";
import type { getOpenOpportunities } from "@/server/actions/quotes";
import { createQuote, type QuoteItemInput } from "@/server/actions/quotes";

export default function QuoteBuilderForm({
  opportunities,
  products,
}: {
  opportunities: Awaited<ReturnType<typeof getOpenOpportunities>>;
  products: Awaited<ReturnType<typeof getProducts>>;
}) {
  const [isPending, startTransition] = useTransition();
  const [opportunityId, setOpportunityId] = useState("");
  const [title, setTitle] = useState("Proposta Comercial");
  const [scope, setScope] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<QuoteItemInput[]>([]);

  // Derived calculations
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalDiscount = items.reduce((acc, item) => acc + Number(item.discount), 0);
  const total = subtotal - totalDiscount;

  function handleAddProduct(productId: string) {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setItems([
      ...items,
      {
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: Number(product.basePrice),
        discount: 0,
      },
    ]);

    // Auto-fill scope/terms if empty
    if (!scope && product.scopeDefault) setScope(product.scopeDefault);
    if (!terms && product.termsDefault) setTerms(product.termsDefault);
  }

  function handleRemoveItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, field: keyof QuoteItemInput, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!opportunityId) {
      alert("Selecione uma oportunidade.");
      return;
    }
    if (items.length === 0) {
      alert("Adicione pelo menos um item.");
      return;
    }

    startTransition(async () => {
      await createQuote({
        opportunityId,
        title,
        scope,
        terms,
        items,
      });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* 1. Header & Association */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
          Informações Básicas
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="opportunityId" className="text-sm font-medium text-slate-700">
              Oportunidade (Kanban)
            </label>
            <Select
              id="opportunityId"
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              required
            >
              <option value="">Selecione uma Oportunidade...</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.company?.tradeName || opp.contact?.firstName} - {opp.title || "Sem título"}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-slate-700">
              Título da Proposta
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Items & Financials */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Itens do Orçamento</h2>
          <div className="flex items-center gap-2">
            <Select
              onChange={(e) => {
                handleAddProduct(e.target.value);
                e.target.value = ""; // reset
              }}
              className="w-auto text-sm"
            >
              <option value="">+ Adicionar do Catálogo...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (R$ {Number(p.basePrice).toFixed(2)})
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setItems([
                  ...items,
                  { description: "Item Personalizado", quantity: 1, unitPrice: 0, discount: 0 },
                ])
              }
            >
              <Plus size={16} /> Item Manual
            </Button>
          </div>
        </div>

        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-600">Descrição</th>
                <th className="px-6 py-3 font-semibold text-slate-600 w-24">Qtd</th>
                <th className="px-6 py-3 font-semibold text-slate-600 w-40">Valor Un. (R$)</th>
                <th className="px-6 py-3 font-semibold text-slate-600 w-32">Desc. (R$)</th>
                <th className="px-6 py-3 font-semibold text-slate-600 w-40 text-right">Total</th>
                <th className="px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum item adicionado. Use o catálogo acima para puxar os valores.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index.toString() + item.description} className="bg-white">
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-transparent hover:border-slate-300 focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 rounded border border-slate-200 focus:border-orange-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 rounded border border-slate-200 focus:border-orange-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) =>
                          handleItemChange(index, "discount", Number(e.target.value))
                        }
                        className="w-full px-3 py-1.5 rounded border border-slate-200 focus:border-orange-500 focus:outline-none text-red-600"
                      />
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.quantity * item.unitPrice - item.discount)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
          <div className="w-80 space-y-3 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  subtotal,
                )}
              </span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Descontos</span>
                <span>
                  -{" "}
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    totalDiscount,
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-bold text-lg pt-3 border-t border-slate-200">
              <span>Total Estimado</span>
              <span>
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  total,
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Text Blocks */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
          Escopo e Metodologia
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Descreva o que está incluso no projeto. O texto padrão foi puxado do catálogo se houver.
          </p>
          <Textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            rows={10}
            className="font-mono text-sm"
            placeholder="- Entregável 1&#10;- Entregável 2"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
          Termos e Condições
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Condições de pagamento, prazos de validade da proposta, etc.
          </p>
          <Textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={6}
            className="text-sm"
            placeholder="A proposta tem validade de 15 dias..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pb-12">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {isPending ? "Salvando..." : "Salvar Proposta (Rascunho)"}
        </Button>
      </div>
    </form>
  );
}
