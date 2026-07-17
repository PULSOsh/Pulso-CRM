"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelContract, sendContract } from "@/server/actions/contracts";

type Contract = {
  id: string;
  code: string;
  title: string;
  status: string;
  content: string;
  publicToken: string;
  signedAt: Date | null;
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  signed: "Assinado",
  cancelled: "Cancelado",
  ended: "Encerrado",
};

export function ContractDetailsClient({
  contract,
  organizationId,
  userId,
}: {
  contract: Contract;
  organizationId: string;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const _publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/contrato/${contract.publicToken}`
      : "";

  async function handleSend() {
    setLoading(true);
    setError(null);
    try {
      await sendContract(contract.id, organizationId, userId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar contrato.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    const reason = window.prompt("Motivo do cancelamento:");
    if (!reason) return;
    setLoading(true);
    setError(null);
    try {
      await cancelContract(contract.id, organizationId, userId, reason);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cancelar contrato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">{contract.code}</p>
          <p className="text-sm font-medium text-orange-600">
            {statusLabels[contract.status] ?? contract.status}
          </p>
        </div>
        <div className="flex gap-3">
          {contract.status === "draft" && (
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              Enviar para assinatura
            </button>
          )}
          {(contract.status === "draft" || contract.status === "sent") && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {contract.status !== "draft" && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500 mb-1">Link público do contrato</p>
          <a
            href={`/contrato/${contract.publicToken}`}
            target="_blank"
            rel="noreferrer"
            className="text-orange-600 hover:underline break-all"
          >
            /contrato/{contract.publicToken}
          </a>
        </div>
      )}

      {contract.signedAt && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800 text-sm">
          Assinado em {new Date(contract.signedAt).toLocaleString("pt-BR")}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
        {contract.content}
      </div>
    </div>
  );
}
