"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCostCenter, deactivateCostCenter } from "@/server/actions/cost-centers";
import { createExpenseCategory } from "@/server/actions/profitability";
import { createVendor, setCompanyVendorFlag } from "@/server/actions/vendors";

type CostCenter = { id: string; name: string; isActive: boolean };
type Category = { id: string; name: string };
type Vendor = { id: string; tradeName: string; documentNumber: string | null };
type Company = { id: string; tradeName: string; isVendor: boolean };

export function CategoriesPanel({
  costCenters,
  categories,
  vendors,
  companies,
}: {
  costCenters: CostCenter[];
  categories: Category[];
  vendors: Vendor[];
  companies: Company[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [costCenterName, setCostCenterName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreateCostCenter(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createCostCenter({ name: costCenterName });
        setCostCenterName("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar centro de custo.");
      }
    });
  }

  function handleDeactivateCostCenter(id: string) {
    startTransition(async () => {
      await deactivateCostCenter(id);
      router.refresh();
    });
  }

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createExpenseCategory({ name: categoryName, scope: "business" });
        setCategoryName("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar categoria.");
      }
    });
  }

  function handleCreateVendor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createVendor({ tradeName: vendorName });
        setVendorName("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar fornecedor.");
      }
    });
  }

  function handleMarkAsVendor(companyId: string) {
    startTransition(async () => {
      await setCompanyVendorFlag(companyId, true);
      router.refresh();
    });
  }

  const nonVendorCompanies = companies.filter((c) => !c.isVendor);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h2 className="font-medium text-slate-900">Centros de custo</h2>
        <form onSubmit={handleCreateCostCenter} className="flex gap-2">
          <Input
            placeholder="Nome (ex.: Marketing)"
            value={costCenterName}
            onChange={(e) => setCostCenterName(e.target.value)}
            required
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Criar
          </Button>
        </form>
        <ul className="space-y-1">
          {costCenters
            .filter((c) => c.isActive)
            .map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between text-sm text-slate-700 py-1"
              >
                {c.name}
                <Button size="sm" variant="ghost" onClick={() => handleDeactivateCostCenter(c.id)}>
                  Remover
                </Button>
              </li>
            ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-slate-900">Categorias financeiras</h2>
        <form onSubmit={handleCreateCategory} className="flex gap-2">
          <Input
            placeholder="Nome (ex.: Aluguel)"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Criar
          </Button>
        </form>
        <ul className="space-y-1">
          {categories.map((c) => (
            <li key={c.id} className="text-sm text-slate-700 py-1">
              {c.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium text-slate-900">Fornecedores</h2>
        <form onSubmit={handleCreateVendor} className="flex gap-2">
          <Input
            placeholder="Nome do fornecedor"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            required
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Criar
          </Button>
        </form>
        <ul className="space-y-1">
          {vendors.map((v) => (
            <li key={v.id} className="text-sm text-slate-700 py-1">
              {v.tradeName}
            </li>
          ))}
        </ul>
      </div>

      {nonVendorCompanies.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-medium text-slate-900">Marcar cliente como fornecedor também</h2>
          <ul className="space-y-1">
            {nonVendorCompanies.slice(0, 20).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between text-sm text-slate-700 py-1"
              >
                {c.tradeName}
                <Button size="sm" variant="ghost" onClick={() => handleMarkAsVendor(c.id)}>
                  Marcar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
    </div>
  );
}
