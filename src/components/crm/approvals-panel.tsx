"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cancelApprovalRequest, createApprovalRequest } from "@/server/actions/approvals";

type Approval = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  publicToken: string;
  requestedAt: Date | string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando decisão",
  approved: "Aprovada",
  approved_with_notes: "Aprovada com observações",
  rejected: "Ajuste solicitado",
  expired: "Expirada",
  cancelled: "Cancelada",
};

export function ApprovalsPanel({
  projectId,
  initialApprovals,
}: {
  projectId: string;
  initialApprovals: Approval[];
}) {
  const router = useRouter();
  const [approvals, setApprovals] = useState(initialApprovals);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const approval = await createApprovalRequest(projectId, { title, description });
        setApprovals((prev) => [approval, ...prev]);
        setCreating(false);
        setTitle("");
        setDescription("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao solicitar aprovação.");
      }
    });
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      try {
        await cancelApprovalRequest(id);
        setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao cancelar.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {creating ? (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-control border border-pulso-border p-4"
        >
          <div>
            <label htmlFor="approval-title" className="text-sm font-medium text-slate-700">
              Título
            </label>
            <Input
              id="approval-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Aprovação do layout final"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="approval-description" className="text-sm font-medium text-slate-700">
              Descrição
            </label>
            <Textarea
              id="approval-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Enviando..." : "Solicitar aprovação"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          Solicitar aprovação
        </Button>
      )}

      {approvals.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma aprovação solicitada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {approvals.map((approval) => (
            <li
              key={approval.id}
              className="flex items-center justify-between gap-3 rounded-control border border-pulso-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{approval.title}</p>
                <p className="text-xs text-slate-500">
                  {STATUS_LABELS[approval.status] ?? approval.status}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`/aprovacao/${approval.publicToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  Ver link
                </a>
                {approval.status === "pending" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleCancel(approval.id)}
                    className="text-pulso-error"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
