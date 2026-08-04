"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { getProposalVersionDetail } from "@/server/actions/quotes";

type VersionSummary = { id: string; versionNumber: number; createdAt: Date };
type VersionDetail = Awaited<ReturnType<typeof getProposalVersionDetail>>;

const formatCurrency = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

function VersionColumn({ detail, loading }: { detail: VersionDetail | null; loading: boolean }) {
  if (loading) return <p className="text-sm text-slate-500">Carregando...</p>;
  if (!detail) return <p className="text-sm text-slate-500">Selecione uma versão.</p>;

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-slate-400">
        {new Date(detail.createdAt).toLocaleString("pt-BR")}
      </p>
      <div>
        <p className="font-medium text-slate-500">Título</p>
        <p className="text-slate-900">{detail.title}</p>
      </div>
      <div>
        <p className="font-medium text-slate-500">Escopo</p>
        <p className="text-slate-900 whitespace-pre-wrap">{detail.scope || "-"}</p>
      </div>
      <div>
        <p className="font-medium text-slate-500">Itens</p>
        <ul className="list-disc pl-5 text-slate-900">
          {detail.items.map((item) => (
            <li key={item.id}>
              {item.description} — {formatCurrency(item.total)}
              {item.isOptional && " (opcional)"}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-medium text-slate-500">Total</p>
        <p className="text-slate-900 font-semibold">{formatCurrency(detail.total)}</p>
      </div>
    </div>
  );
}

export function VersionCompareModal({
  open,
  onClose,
  proposalId,
  versions,
}: {
  open: boolean;
  onClose: () => void;
  proposalId: string;
  versions: VersionSummary[];
}) {
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  const [leftId, setLeftId] = useState(sorted[1]?.id ?? sorted[0]?.id ?? "");
  const [rightId, setRightId] = useState(sorted[0]?.id ?? "");
  const [leftDetail, setLeftDetail] = useState<VersionDetail | null>(null);
  const [rightDetail, setRightDetail] = useState<VersionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      leftId ? getProposalVersionDetail(proposalId, leftId) : Promise.resolve(null),
      rightId ? getProposalVersionDetail(proposalId, rightId) : Promise.resolve(null),
    ])
      .then(([a, b]) => {
        if (cancelled) return;
        setLeftDetail(a);
        setRightDetail(b);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, leftId, rightId, proposalId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comparar versões"
      description="Veja lado a lado o que mudou entre duas versões publicadas."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select value={leftId} onChange={(e) => setLeftId(e.target.value)}>
            {sorted.map((v) => (
              <option key={v.id} value={v.id}>
                Versão {v.versionNumber}
              </option>
            ))}
          </Select>
          <Select value={rightId} onChange={(e) => setRightId(e.target.value)}>
            {sorted.map((v) => (
              <option key={v.id} value={v.id}>
                Versão {v.versionNumber}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
          <VersionColumn detail={leftDetail} loading={loading} />
          <VersionColumn detail={rightDetail} loading={loading} />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
