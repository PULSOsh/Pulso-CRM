"use client";

import { FileSignature, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import { createContractFromProposal } from "@/server/actions/contracts";

type Contract = {
  id: string;
  code: string;
  title: string;
  status: string;
  createdAt: Date;
};

type AvailableProposal = {
  id: string;
  code: string;
  title: string;
  total: string;
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  signed: "Assinado",
  cancelled: "Cancelado",
  ended: "Encerrado",
};

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  sent: "bg-blue-100 text-blue-800",
  signed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  ended: "bg-slate-200 text-slate-600",
};

export function ContractsClient({
  initialContracts,
  availableProposals,
}: {
  initialContracts: Contract[];
  availableProposals: AvailableProposal[];
}) {
  const [contracts, setContracts] = useState(initialContracts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!selectedProposalId) return;
    setLoading(true);
    setError(null);
    try {
      const contract = await createContractFromProposal(selectedProposalId);
      setContracts([contract, ...contracts]);
      setIsModalOpen(false);
      setSelectedProposalId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar contrato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 flex flex-col h-full max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSignature size={24} className="text-orange-600" />
            Contratos
          </h1>
          <p className="text-slate-500 mt-1">Gere contratos a partir de propostas aprovadas.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={availableProposals.length === 0}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          Gerar Contrato
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Código</th>
                <th className="p-4 font-medium">Título</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Data</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Nenhum contrato gerado ainda.
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-500">{contract.code}</td>
                    <td className="p-4 font-semibold text-slate-900">{contract.title}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[contract.status] ?? "bg-slate-100 text-slate-800"}`}
                      >
                        {statusLabels[contract.status] ?? contract.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-right text-sm">
                      {new Date(contract.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/crm/contratos/${contract.id}`}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Gerar Contrato</h2>
              <p className="text-slate-500 text-sm mt-1">
                Selecione uma proposta aprovada para gerar o contrato.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <Select
                value={selectedProposalId}
                onChange={(e) => setSelectedProposalId(e.target.value)}
              >
                <option value="">Selecione uma proposta aprovada...</option>
                {availableProposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.title} (R$ {p.total})
                  </option>
                ))}
              </Select>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !selectedProposalId}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {loading ? "Gerando..." : "Gerar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
