"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createLossReason } from "@/server/actions/loss-reasons";
import { loseOpportunity, winOpportunity } from "@/server/actions/opportunities";

export function WinLoseButtons({
  opportunityId,
  status,
  lossReasons,
}: {
  opportunityId: string;
  status: string;
  lossReasons: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [lostReasonId, setLostReasonId] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [saveAsNewReason, setSaveAsNewReason] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "open") {
    return (
      <p className="text-sm text-slate-500">
        Esta oportunidade já está {status === "won" ? "ganha" : "perdida"}.
      </p>
    );
  }

  function handleWin() {
    setError(null);
    startTransition(async () => {
      try {
        await winOpportunity(opportunityId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao marcar como ganho.");
      }
    });
  }

  function handleLose(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        let reasonId = lostReasonId || undefined;
        if (saveAsNewReason && !reasonId) {
          const created = await createLossReason(lostReason);
          reasonId = created.id;
        }
        await loseOpportunity(opportunityId, { lostReason, lostReasonId: reasonId });
        setShowLoseModal(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao marcar como perdido.");
      }
    });
  }

  function handleReasonSelect(id: string) {
    setLostReasonId(id);
    const reason = lossReasons.find((r) => r.id === id);
    if (reason) setLostReason(reason.label);
  }

  return (
    <div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleWin}
          disabled={isPending}
          className="flex-1 bg-green-50 text-green-700 border border-green-200 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 size={20} /> Ganho
        </button>
        <button
          type="button"
          onClick={() => setShowLoseModal(true)}
          disabled={isPending}
          className="flex-1 bg-red-50 text-red-700 border border-red-200 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <XCircle size={20} /> Perdido
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      {showLoseModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleLose}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="font-semibold text-lg">Motivo da perda</h3>
            {lossReasons.length > 0 && (
              <select
                value={lostReasonId}
                onChange={(e) => handleReasonSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">-- Selecione um motivo (opcional) --</option>
                {lossReasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.label}
                  </option>
                ))}
              </select>
            )}
            <textarea
              value={lostReason}
              onChange={(e) => {
                setLostReason(e.target.value);
                setLostReasonId("");
              }}
              required
              maxLength={180}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Ex: Cliente escolheu concorrente por preço"
            />
            {!lostReasonId && lostReason.trim().length > 0 && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={saveAsNewReason}
                  onChange={(e) => setSaveAsNewReason(e.target.checked)}
                />
                Adicionar "{lostReason.trim()}" à lista de motivos
              </label>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLoseModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
              >
                Confirmar perda
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
