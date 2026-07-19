"use client";

import { Loader2, Package, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addOpportunityProduct, removeOpportunityProduct } from "@/server/actions/pipeline";

type LinkedProduct = {
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  notes: string | null;
  product: { name: string } | null;
};

type CatalogProduct = { id: string; name: string; basePrice: string };

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function OpportunityProductsPanel({
  opportunityId,
  linkedProducts,
  catalog,
}: {
  opportunityId: string;
  linkedProducts: LinkedProduct[];
  catalog: CatalogProduct[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  const linkedTotal = linkedProducts.reduce(
    (acc, p) => acc + (Number(p.quantity) * Number(p.unitPrice) - Number(p.discount)),
    0,
  );

  function handleSelectProduct(id: string) {
    setProductId(id);
    const product = catalog.find((p) => p.id === id);
    if (product) setUnitPrice(product.basePrice);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!productId) {
      setError("Selecione um produto.");
      return;
    }
    startTransition(async () => {
      try {
        await addOpportunityProduct(opportunityId, {
          productId,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          discount: 0,
        });
        setAdding(false);
        setProductId("");
        setQuantity("1");
        setUnitPrice("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao vincular produto.");
      }
    });
  }

  function handleRemove(productIdToRemove: string) {
    startTransition(async () => {
      await removeOpportunityProduct(opportunityId, productIdToRemove);
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Produtos vinculados</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            <Plus size={14} /> Vincular produto
          </button>
        )}
      </div>

      {linkedProducts.length === 0 && !adding ? (
        <div className="flex flex-col items-center text-center py-6 text-slate-500">
          <Package size={28} className="mb-2 text-slate-300" />
          <p className="text-sm">Nenhum produto vinculado a esta oportunidade ainda.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {linkedProducts.map((p) => (
            <div key={p.productId} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-900 text-sm">
                  {p.product?.name ?? "Produto removido"}
                </p>
                <p className="text-xs text-slate-500">
                  {Number(p.quantity)}x {currency(Number(p.unitPrice))}
                  {Number(p.discount) > 0 && ` · desconto ${currency(Number(p.discount))}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900 text-sm">
                  {currency(Number(p.quantity) * Number(p.unitPrice) - Number(p.discount))}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(p.productId)}
                  disabled={isPending}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {linkedProducts.length > 0 && (
            <div className="flex justify-between pt-3 text-sm">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold text-slate-900">{currency(linkedTotal)}</span>
            </div>
          )}
        </div>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <select
            value={productId}
            onChange={(e) => handleSelectProduct(e.target.value)}
            className="w-full h-10 px-3 border border-slate-200 rounded-md text-sm"
          >
            <option value="">Selecione um produto do catálogo...</option>
            {catalog.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({currency(Number(p.basePrice))})
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Qtd."
              className="h-10 px-3 border border-slate-200 rounded-md text-sm"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="Valor unitário"
              className="h-10 px-3 border border-slate-200 rounded-md text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              disabled={isPending}
              className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
              Vincular
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
