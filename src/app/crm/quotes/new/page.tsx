import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveOrganizationId } from "@/server/actions/organization";
import { getProducts } from "@/server/actions/products";
import { getOpenOpportunities } from "@/server/actions/quotes";
import { auth } from "@/server/auth";
import QuoteBuilderForm from "./quote-builder-form";

export default async function NewQuotePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const orgId = await getActiveOrganizationId(session.user.id);

  const [opportunities, products] = await Promise.all([
    getOpenOpportunities(orgId),
    getProducts(orgId),
  ]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/crm/quotes"
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nova Proposta</h1>
          <p className="text-slate-500 mt-1">Crie um orçamento vinculado a uma oportunidade</p>
        </div>
      </div>

      <QuoteBuilderForm
        opportunities={opportunities}
        products={products}
        organizationId={orgId}
        userId={session.user.id}
      />
    </div>
  );
}
