"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  createStage,
  deleteStage,
  reorderStage,
  updateStage,
} from "@/server/actions/pipeline";

export type StageDetail = {
  id: string;
  name: string;
  color: string | null;
  probability: number;
  isWon: boolean;
  isLost: boolean;
};

function StageRow({
  stage,
  isFirst,
  isLast,
  onChanged,
}: {
  stage: StageDetail;
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => void;
}) {
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color ?? "#64748b");
  const [probability, setProbability] = useState(String(stage.probability));
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    name !== stage.name || color !== (stage.color ?? "#64748b") || probability !== String(stage.probability);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateStage(stage.id, { name, color, probability: Number(probability) });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar etapa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(direction: "up" | "down") {
    setMoving(true);
    setError(null);
    try {
      await reorderStage(stage.id, direction);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reordenar etapa.");
    } finally {
      setMoving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteStage(stage.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir etapa.");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-slate-200"
          aria-label="Cor da etapa"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          aria-label="Nome da etapa"
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={probability}
          onChange={(e) => setProbability(e.target.value)}
          className="w-20"
          aria-label="Probabilidade (%)"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isFirst || moving}
          onClick={() => handleMove("up")}
          title="Mover para cima"
        >
          <ArrowUp size={16} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isLast || moving}
          onClick={() => handleMove("down")}
          title="Mover para baixo"
        >
          <ArrowDown size={16} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={deleting}
          onClick={() => setConfirmingDelete(true)}
          title="Excluir etapa"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      {(stage.isWon || stage.isLost) && (
        <span className="text-xs text-slate-400">
          {stage.isWon ? "Etapa usada quando uma oportunidade é marcada como ganha." : null}
          {stage.isLost ? "Etapa usada quando uma oportunidade é marcada como perdida." : null}
        </span>
      )}

      {dirty && (
        <div className="flex justify-end">
          <Button type="button" size="sm" disabled={saving} onClick={handleSave}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      )}

      {confirmingDelete && (
        <div className="flex items-center justify-between rounded-md bg-red-50 p-2 text-sm">
          <span>Excluir esta etapa? Só é possível se não houver oportunidade vinculada.</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </div>
        </div>
      )}

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function ManageStagesModal({
  open,
  onClose,
  pipelineId,
  stages,
}: {
  open: boolean;
  onClose: () => void;
  pipelineId: string;
  stages: StageDetail[];
}) {
  const router = useRouter();
  const [newStageName, setNewStageName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createStage(pipelineId, { name: newStageName, probability: 0 });
      setNewStageName("");
      refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erro ao criar etapa.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gerenciar Etapas"
      description="Crie, renomeie, reordene ou remova as etapas deste funil."
    >
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <StageRow
            key={stage.id}
            stage={stage}
            isFirst={index === 0}
            isLast={index === stages.length - 1}
            onChanged={refresh}
          />
        ))}

        <form onSubmit={handleCreate} className="flex items-end gap-2 border-t border-slate-200 pt-3">
          <div className="flex-1">
            <label htmlFor="new-stage-name" className="block text-sm font-medium mb-1">
              Nova etapa
            </label>
            <Input
              id="new-stage-name"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Ex: Diagnóstico"
              required
            />
          </div>
          <Button type="submit" disabled={creating || !newStageName.trim()}>
            {creating ? "Criando..." : "Adicionar"}
          </Button>
        </form>
        {createError && <span className="text-xs text-red-600">{createError}</span>}
      </div>
    </Modal>
  );
}
