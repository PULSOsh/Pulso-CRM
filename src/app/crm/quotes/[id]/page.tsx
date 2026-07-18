import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuoteDetailClient } from "@/components/crm/quotes/quote-detail-client";
import { getFilesForEntity } from "@/server/actions/files";
import { getProducts } from "@/server/actions/products";
import { getQuoteById } from "@/server/actions/quotes";
import { auth } from "@/server/auth";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;
  const result = await getQuoteById(id);
  if (!result) notFound();

  const { proposal, version, items, allVersions } = result;

  const [products, files] = await Promise.all([getProducts(), getFilesForEntity("proposal", id)]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/crm/quotes"
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Proposta {proposal.code}</h1>
      </div>

      <QuoteDetailClient
        proposal={{
          id: proposal.id,
          code: proposal.code,
          title: proposal.title,
          status: proposal.status,
          total: proposal.total,
          publicToken: proposal.publicToken,
          publicAccessEnabled: proposal.publicAccessEnabled,
        }}
        items={items.map((item) => ({
          productId: item.productId ?? undefined,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
        }))}
        scope={version?.scope ?? ""}
        terms={version?.terms ?? ""}
        allVersions={allVersions}
        products={products}
        initialFiles={files}
      />
    </div>
  );
}
