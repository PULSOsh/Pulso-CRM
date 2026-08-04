"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FilesPanel } from "@/components/crm/files-panel";
import { Button } from "@/components/ui/button";
import type { getProducts } from "@/server/actions/products";
import {
  createNewProposalVersion,
  publishQuote,
  type QuoteItemInput,
  updateQuoteDraft,
} from "@/server/actions/quotes";
import { QuoteContentForm } from "./quote-content-form";
import { VersionCompareModal } from "./version-compare-modal";

type FileRow = Parameters<typeof FilesPanel>[0]["initialFiles"];

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  viewed: "Visualizada pelo cliente",
  approved: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
  cancelled: "Cancelada",
};

export function QuoteDetailClient({
  proposal,
  items,
  scope,
  terms,
  validUntil,
  notIncluded,
  responsibilities,
  paymentPlan,
  allVersions,
  products,
  initialFiles,
}: {
  proposal: {
    id: string;
    code: string;
    title: string;
    status: string;
    total: string;
    publicToken: string;
    publicAccessEnabled: boolean;
  };
  items: QuoteItemInput[];
  scope: string;
  terms: string;
  validUntil: string;
  notIncluded: string;
  responsibilities: string;
  paymentPlan: {
    description: string;
    entryAmount: number;
    installmentCount: number;
    installmentAmount: number;
  } | null;
  allVersions: { id: string; versionNumber: number; createdAt: Date }[];
  products: Awaited<ReturnType<typeof getProducts>>;
  initialFiles: FileRow;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const canEditFreely = proposal.status === "draft" && !proposal.publicAccessEnabled;
  const canPublish = proposal.status === "draft" && !proposal.publicAccessEnabled;
  const canCreateNewVersion = proposal.publicAccessEnabled && proposal.status !== "approved";

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      try {
        await publishQuote(proposal.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao publicar.");
      }
    });
  }

  if (editing) {
    return (
      <QuoteContentForm
        products={products}
        initialTitle={proposal.title}
        initialScope={scope}
        initialTerms={terms}
        initialItems={items}
        initialValidUntil={validUntil}
        initialNotIncluded={notIncluded}
        initialResponsibilities={responsibilities}
        initialPaymentPlan={paymentPlan}
        submitLabel={canEditFreely ? "Salvar rascunho" : "Publicar nova versão"}
        onSave={async (data) => {
          if (canEditFreely) {
            await updateQuoteDraft(proposal.id, data);
          } else {
            await createNewProposalVersion(proposal.id, data);
          }
          setEditing(false);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{proposal.code}</p>
            <h2 className="text-xl font-bold text-slate-900">{proposal.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Status:{" "}
              <span className="font-medium">
                {STATUS_LABELS[proposal.status] ?? proposal.status}
              </span>
              {allVersions.length > 1 && (
                <>
                  {" "}
                  • {allVersions.length} versões •{" "}
                  <button
                    type="button"
                    onClick={() => setIsCompareOpen(true)}
                    className="text-orange-600 hover:underline"
                  >
                    Comparar versões
                  </button>
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                Number(proposal.total),
              )}
            </p>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {canEditFreely && (
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              Editar rascunho
            </Button>
          )}
          {canPublish && (
            <Button type="button" disabled={isPending} onClick={handlePublish}>
              {isPending ? "Publicando..." : "Publicar"}
            </Button>
          )}
          {canCreateNewVersion && (
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              Criar nova versão
            </Button>
          )}
          {proposal.publicAccessEnabled && (
            <a
              href={`/proposta/${proposal.publicToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Ver página pública →
            </a>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <h3 className="font-semibold text-lg mb-4">Itens</h3>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2">Descrição</th>
              <th className="py-2 text-right">Qtd</th>
              <th className="py-2 text-right">Valor Un.</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={`${item.productId ?? "manual"}-${item.description}`}>
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    item.unitPrice,
                  )}
                </td>
                <td className="py-2 text-right">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    item.quantity * item.unitPrice - item.discount,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(scope || terms) && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          {scope && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Escopo</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{scope}</p>
            </div>
          )}
          {terms && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Termos</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{terms}</p>
            </div>
          )}
        </div>
      )}

      {(paymentPlan || notIncluded || responsibilities || validUntil) && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          {validUntil && (
            <p className="text-sm text-slate-500">
              Válida até {new Date(`${validUntil}T00:00:00`).toLocaleDateString("pt-BR")}
            </p>
          )}
          {paymentPlan && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Condição de pagamento</h3>
              {paymentPlan.description && (
                <p className="text-sm text-slate-700 mb-2">{paymentPlan.description}</p>
              )}
              <p className="text-sm text-slate-500">
                {paymentPlan.entryAmount > 0 &&
                  `Entrada: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(paymentPlan.entryAmount)}`}
                {paymentPlan.installmentCount > 0 &&
                  ` • ${paymentPlan.installmentCount}x de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(paymentPlan.installmentAmount)}`}
              </p>
            </div>
          )}
          {responsibilities && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Responsabilidades do cliente</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{responsibilities}</p>
            </div>
          )}
          {notIncluded && (
            <div>
              <h3 className="font-semibold text-lg mb-2">O que não está incluso</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{notIncluded}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <h3 className="font-semibold text-lg mb-4">Arquivos</h3>
        <p className="mb-3 text-sm text-slate-500">
          Marque "Visível na página pública" para anexos que o cliente deve ver (portfólio,
          exemplos).
        </p>
        <FilesPanel
          entityType="proposal"
          entityId={proposal.id}
          initialFiles={initialFiles}
          allowPublicToggle
        />
      </div>

      <VersionCompareModal
        open={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        proposalId={proposal.id}
        versions={allVersions}
      />
    </div>
  );
}
