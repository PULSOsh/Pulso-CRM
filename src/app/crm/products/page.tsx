import { Download, Package, Plus } from "lucide-react";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveOrganizationId } from "@/server/actions/organization";
import { getProducts, seedProductsFromCatalog } from "@/server/actions/products";
import { auth } from "@/server/auth";

export default async function ProductsCatalogPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const orgId = await getActiveOrganizationId(session.user.id);
  const products = await getProducts(orgId);

  // Quick form action to trigger the seed
  async function handleSeed() {
    "use server";
    await seedProductsFromCatalog(orgId);
    revalidatePath("/crm/products");
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package size={24} className="text-orange-600" />
            Catálogo de Produtos
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os serviços, preços e prazos da PULSO</p>
        </div>

        <div className="flex items-center gap-4">
          {products.length === 0 && (
            <form action={handleSeed}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                <Download size={16} />
                Importar da Nuvem (PULSO)
              </button>
            </form>
          )}

          <Link
            href="/crm/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
          >
            <Plus size={16} />
            Novo Produto
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl flex-1 overflow-hidden flex flex-col">
        {products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Package size={48} className="mb-4 text-slate-300" />
            <p>Nenhum produto cadastrado.</p>
            <p className="text-sm">Clique em "Importar da Nuvem" para buscar do seu site.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600">Produto</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Categoria</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Prazo Médio</th>
                  <th className="px-6 py-4 font-semibold text-slate-600">Preço Base</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {product.name}
                      <p className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1 max-w-xs">
                        {product.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {product.averageDeliveryDays ? `${product.averageDeliveryDays} dias` : "-"}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(product.basePrice))}
                      {product.pricingUnit === "monthly" && (
                        <span className="text-slate-500 font-normal text-xs">/mês</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/crm/products/${product.id}`}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
