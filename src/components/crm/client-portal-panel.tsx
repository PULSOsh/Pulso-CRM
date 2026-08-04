"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  closeProject,
  disableClientPortal,
  enableClientPortal,
} from "@/server/actions/client-portal";

export function ClientPortalPanel({
  projectId,
  clientPortalEnabled,
  clientPortalToken,
  status,
}: {
  projectId: string;
  clientPortalEnabled: boolean;
  clientPortalToken: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");

  const portalUrl =
    typeof window !== "undefined" ? `${window.location.origin}/portal/${clientPortalToken}` : "";

  async function handleEnable() {
    setLoading(true);
    setError(null);
    try {
      await enableClientPortal(projectId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar portal.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    setError(null);
    try {
      await disableClientPortal(projectId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desativar portal.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleClose() {
    setLoading(true);
    setError(null);
    try {
      await closeProject(projectId, { notes: closeNotes });
      setShowCloseForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao encerrar projeto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!clientPortalEnabled ? (
        <Button type="button" variant="outline" size="sm" onClick={handleEnable} disabled={loading}>
          Ativar portal do cliente
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={portalUrl}
              className="flex-1 text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-600"
            />
            <Button type="button" size="sm" onClick={handleCopy}>
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleDisable} disabled={loading}>
            Desativar portal
          </Button>
        </div>
      )}

      {status !== "completed" && (
        <div className="border-t border-slate-200 pt-3">
          {!showCloseForm ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCloseForm(true)}>
              Encerrar projeto
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Notas de encerramento (opcional)"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCloseForm(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={handleClose} disabled={loading}>
                  Confirmar encerramento
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === "completed" && (
        <p className="text-sm text-green-700">Projeto encerrado.</p>
      )}
    </div>
  );
}
