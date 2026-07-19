import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
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

  const [opportunities, products] = await Promise.all([getOpenOpportunities(), getProducts()]);

  return (
    <AppShell active="budgets" eyebrow="COMERCIAL" title="Gerador de orçamento">
      <div className="p-4 md:p-8">
        <QuoteBuilderForm opportunities={opportunities} products={products} />
      </div>
    </AppShell>
  );
}
