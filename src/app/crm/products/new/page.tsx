import { ArrowLeft, Save } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProduct } from "@/server/actions/products";
import { auth } from "@/server/auth";

export default async function NewProductPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  async function handleCreate(formData: FormData) {
    "use server";

    await createProduct({
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      basePrice: formData.get("basePrice") as string,
      pricingUnit: formData.get("pricingUnit") as string,
      averageDeliveryDays: Number(formData.get("averageDeliveryDays")) || 0,
      scopeDefault: formData.get("scopeDefault") as string,
    });

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
          <h1 className="text-2xl font-bold text-slate-900">Novo Produto</h1>
          <p className="text-slate-500 mt-1">Adicione um novo serviço ao seu catálogo</p>
        </div>
      </div>

      <form
        action={handleCreate}
        className="bg-white border border-slate-200 rounded-xl p-8 space-y-8"
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Nome do Produto
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Ex: Desenvolvimento de E-commerce"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-slate-700">
              Categoria
            </label>
            <Select id="category" name="category">
              <option value="Entrada rápida">Entrada rápida</option>
              <option value="Sites">Sites</option>
              <option value="Tecnologia">Tecnologia</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Consultoria">Consultoria</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Descrição Curta
          </label>
          <Input
            type="text"
            id="description"
            name="description"
            placeholder="Resumo que aparece no catálogo"
          />
        </div>

        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <label htmlFor="basePrice" className="text-sm font-medium text-slate-700">
              Preço Base (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              id="basePrice"
              name="basePrice"
              required
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pricingUnit" className="text-sm font-medium text-slate-700">
              Unidade de Venda
            </label>
            <Select id="pricingUnit" name="pricingUnit">
              <option value="project">Por Projeto (Fixo)</option>
              <option value="monthly">Mensalidade (Recorrente)</option>
              <option value="hour">Por Hora</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="averageDeliveryDays" className="text-sm font-medium text-slate-700">
              Prazo Médio (Dias)
            </label>
            <Input
              type="number"
              id="averageDeliveryDays"
              name="averageDeliveryDays"
              placeholder="Ex: 15"
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
          <Textarea
            id="scopeDefault"
            name="scopeDefault"
            rows={8}
            placeholder="- Criação de X páginas&#10;- Integração com Y&#10;- Não inclui: Hospedagem"
          />
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <Link
            href="/crm/products"
            className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Cancelar
          </Link>
          <Button type="submit">
            <Save size={20} />
            Salvar Produto
          </Button>
        </div>
      </form>
    </div>
  );
}
