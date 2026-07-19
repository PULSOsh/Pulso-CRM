"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { getProducts } from "@/server/actions/products";
import type { QuoteItemInput } from "@/server/actions/quotes";

/** Shared editor for a proposal's content (title/scope/terms/items) - used by
 * both "edit draft in place" and "create new version" flows on the quote
 * detail page. Does not include the opportunity picker (fixed after creation),
 * unlike quote-builder-form.tsx which is only used at initial creation. */
type PaymentPlanState = {
  description: string;
  entryAmount: number;
  installmentCount: number;
  installmentAmount: number;
} | null;

export function QuoteContentForm({
  products,
  initialTitle,
  initialScope,
  initialTerms,
  initialItems,
  initialValidUntil,
  initialNotIncluded,
  initialResponsibilities,
  initialPaymentPlan,
  submitLabel,
  onSave,
}: {
  products: Awaited<ReturnType<typeof getProducts>>;
  initialTitle: string;
  initialScope: string;
  initialTerms: string;
  initialItems: QuoteItemInput[];
  initialValidUntil: string;
  initialNotIncluded: string;
  initialResponsibilities: string;
  initialPaymentPlan: PaymentPlanState;
  submitLabel: string;
  onSave: (data: {
    title: string;
    scope: string;
    terms: string;
    items: QuoteItemInput[];
    validUntil?: string;
    blocks: {
      stableKey: "not_included" | "responsibilities";
      title: string;
      body: string;
      isEnabled: boolean;
    }[];
    paymentPlan: {
      name: string;
      description: string;
      entryAmount: number;
      installmentCount: number;
      installmentAmount: number;
    } | null;
  }) => Promise<unknown>;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialTitle);
  const [scope, setScope] = useState(initialScope);
  const [terms, setTerms] = useState(initialTerms);
  const [items, setItems] = useState<QuoteItemInput[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState(initialValidUntil);
  const [notIncludedEnabled, setNotIncludedEnabled] = useState(!!initialNotIncluded);
  const [notIncludedText, setNotIncludedText] = useState(initialNotIncluded);
  const [responsibilitiesEnabled, setResponsibilitiesEnabled] = useState(!!initialResponsibilities);
  const [responsibilitiesText, setResponsibilitiesText] = useState(initialResponsibilities);
  const [paymentEnabled, setPaymentEnabled] = useState(!!initialPaymentPlan);
  const [paymentDescription, setPaymentDescription] = useState(
    initialPaymentPlan?.description ?? "",
  );
  const [entryAmount, setEntryAmount] = useState(
    initialPaymentPlan?.entryAmount ? String(initialPaymentPlan.entryAmount) : "",
  );
  const [installmentCount, setInstallmentCount] = useState(
    initialPaymentPlan?.installmentCount ? String(initialPaymentPlan.installmentCount) : "1",
  );

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalDiscount = items.reduce((acc, item) => acc + Number(item.discount), 0);
  const total = subtotal - totalDiscount;

  const entryAmountNumber = Number(entryAmount || 0);
  const installmentCountNumber = Number(installmentCount || 0);
  const remainingAfterEntry = Math.max(total - entryAmountNumber, 0);
  const installmentAmountComputed =
    installmentCountNumber > 0 ? remainingAfterEntry / installmentCountNumber : 0;

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
    setError(null);
    if (items.length === 0) {
      setError("Adicione pelo menos um item.");
      return;
    }
    startTransition(async () => {
      try {
        await onSave({
          title,
          scope,
          terms,
          items,
          validUntil,
          blocks: [
            {
              stableKey: "not_included",
              title: "O que não está incluso",
              body: notIncludedText,
              isEnabled: notIncludedEnabled,
            },
            {
              stableKey: "responsibilities",
              title: "Responsabilidades do cliente",
              body: responsibilitiesText,
              isEnabled: responsibilitiesEnabled,
            },
          ],
          paymentPlan: paymentEnabled
            ? {
                name: "Condição de pagamento",
                description: paymentDescription,
                entryAmount: entryAmountNumber,
                installmentCount: installmentCountNumber,
                installmentAmount: installmentAmountComputed,
              }
            : null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
          Informações Básicas
        </h2>
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Itens do Orçamento</h2>
          <div className="flex items-center gap-2">
            <Select
              onChange={(e) => {
                handleAddProduct(e.target.value);
                e.target.value = "";
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
                <th className="px-6 py-3 w-12" />
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
                      <Input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        className="min-h-0 rounded border border-transparent px-3 py-1.5 hover:border-slate-300 focus:border-orange-500 focus:ring-0"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", Number(e.target.value))
                        }
                        className="min-h-0 rounded border border-slate-200 px-3 py-1.5 focus:border-orange-500 focus:ring-0"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, "unitPrice", Number(e.target.value))
                        }
                        className="min-h-0 rounded border border-slate-200 px-3 py-1.5 focus:border-orange-500 focus:ring-0"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) =>
                          handleItemChange(index, "discount", Number(e.target.value))
                        }
                        className="min-h-0 rounded border border-slate-200 px-3 py-1.5 text-red-600 focus:border-orange-500 focus:ring-0"
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

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
          Escopo e Metodologia
        </h2>
        <Textarea
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          rows={10}
          className="font-mono text-sm"
          placeholder="- Entregável 1&#10;- Entregável 2"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
          Termos e Condições
        </h2>
        <Textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={6}
          className="text-sm"
          placeholder="A proposta tem validade de 15 dias..."
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
          Validade e pagamento
        </h2>
        <div className="space-y-2">
          <label htmlFor="validUntil" className="text-sm font-medium text-slate-700">
            Válida até
          </label>
          <Input
            id="validUntil"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={paymentEnabled}
            onChange={(e) => setPaymentEnabled(e.target.checked)}
          />
          Definir condição de pagamento estruturada
        </label>

        {paymentEnabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="entryAmount" className="text-sm font-medium text-slate-700">
                  Entrada (R$)
                </label>
                <Input
                  id="entryAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="installmentCount" className="text-sm font-medium text-slate-700">
                  Parcelas restantes
                </label>
                <Input
                  id="installmentCount"
                  type="number"
                  min="1"
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="paymentDescription" className="text-sm font-medium text-slate-700">
                Descrição da condição
              </label>
              <Input
                id="paymentDescription"
                type="text"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                placeholder="Ex: 50% na aprovação, 50% na entrega"
              />
            </div>
            {(entryAmountNumber > 0 || installmentCountNumber > 0) && (
              <p className="text-sm text-slate-500">
                Entrada de{" "}
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  entryAmountNumber,
                )}{" "}
                + {installmentCountNumber}
                {installmentCountNumber === 1 ? " parcela" : " parcelas"} de{" "}
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  installmentAmountComputed,
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
          O que não está incluso
        </h2>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={notIncludedEnabled}
            onChange={(e) => setNotIncludedEnabled(e.target.checked)}
          />
          Incluir esta seção na proposta
        </label>
        {notIncludedEnabled && (
          <Textarea
            value={notIncludedText}
            onChange={(e) => setNotIncludedText(e.target.value)}
            rows={4}
            className="text-sm"
            placeholder={"Integrações automáticas não previstas no escopo\nAplicativos nativos"}
          />
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4">
          Responsabilidades do cliente
        </h2>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={responsibilitiesEnabled}
            onChange={(e) => setResponsibilitiesEnabled(e.target.checked)}
          />
          Incluir esta seção na proposta
        </label>
        {responsibilitiesEnabled && (
          <Textarea
            value={responsibilitiesText}
            onChange={(e) => setResponsibilitiesText(e.target.value)}
            rows={4}
            className="text-sm"
            placeholder={"Fornecimento de logo, cores e textos\nAprovação das etapas no prazo"}
          />
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-4 pb-12">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {isPending ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
