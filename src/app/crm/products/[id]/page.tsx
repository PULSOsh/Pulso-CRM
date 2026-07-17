import { eq } from "drizzle-orm";
import { ArrowLeft, Save } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getActiveOrganizationId } from "@/server/actions/organization";
import { getProductById } from "@/server/actions/products";
import { auth } from "@/server/auth";
import { db } from "@/server/db/connection";
import { products } from "@/server/db/schema";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const orgId = await getActiveOrganizationId(session.user.id);
  const product = await getProductById(params.id, orgId);

  if (!product) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";

    await db
      .update(products)
      .set({
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        description: formData.get("description") as string,
        basePrice: formData.get("basePrice") as string,
        pricingUnit: formData.get("pricingUnit") as string,
        averageDeliveryDays: Number(formData.get("averageDeliveryDays")) || 0,
        scopeDefault: formData.get("scopeDefault") as string,
        updatedAt: new Date(),
      })
      .where(eq(products.id, params.id));

    redirect("/crm/products");
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/crm/products"
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Produto</h1>
          <p className="text-slate-500 mt-1">Atualize as informações de {product.name}</p>
        </div>
      </div>

      <form
        action={handleUpdate}
        className="bg-white border border-slate-200 rounded-xl p-8 space-y-8"
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Nome do Produto
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={product.name}
              required
              className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-slate-700">
              Categoria
            </label>
            <select
              id="category"
              name="category"
              defaultValue={product.category || ""}
              className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="Entrada rápida">Entrada rápida</option>
              <option value="Sites">Sites</option>
              <option value="Tecnologia">Tecnologia</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Consultoria">Consultoria</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Descrição Curta
          </label>
          <input
            type="text"
            id="description"
            name="description"
            defaultValue={product.description || ""}
            className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <label htmlFor="basePrice" className="text-sm font-medium text-slate-700">
              Preço Base (R$)
            </label>
            <input
              type="number"
              step="0.01"
              id="basePrice"
              name="basePrice"
              defaultValue={product.basePrice}
              required
              className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pricingUnit" className="text-sm font-medium text-slate-700">
              Unidade de Venda
            </label>
            <select
              id="pricingUnit"
              name="pricingUnit"
              defaultValue={product.pricingUnit}
              className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="project">Por Projeto (Fixo)</option>
              <option value="monthly">Mensalidade (Recorrente)</option>
              <option value="hour">Por Hora</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="averageDeliveryDays" className="text-sm font-medium text-slate-700">
              Prazo Médio (Dias)
            </label>
            <input
              type="number"
              id="averageDeliveryDays"
              name="averageDeliveryDays"
              defaultValue={product.averageDeliveryDays || ""}
              className="w-full h-11 px-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-100">
          <label htmlFor="scopeDefault" className="text-sm font-medium text-slate-700">
            Escopo Padrão e Inclusões
            <span className="block text-xs text-slate-500 font-normal mt-0.5">
              Utilize formatação em texto para listar entregáveis, limites e exclusões.
            </span>
          </label>
          <textarea
            id="scopeDefault"
            name="scopeDefault"
            rows={8}
            defaultValue={product.scopeDefault || ""}
            className="w-full p-4 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y"
          />
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <Link
            href="/crm/products"
            className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-sm"
          >
            <Save size={20} />
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
