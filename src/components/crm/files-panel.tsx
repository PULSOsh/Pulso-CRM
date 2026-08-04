"use client";

import { Download, FileText, History, Trash2, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import {
  deleteFile,
  getFileDownloadUrl,
  getFileVersionHistory,
  uploadFile,
} from "@/server/actions/files";
import type { AttachableEntityType } from "@/server/attachable-entity-types";

type FileRow = {
  attachmentId: string;
  fileId: string;
  originalName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Date | string;
  label: string | null;
  versionNumber?: number;
};

type VersionRow = {
  attachmentId: string;
  fileId: string;
  originalName: string;
  versionNumber: number;
  isCurrent: boolean;
  createdAt: Date | string;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesPanel({
  entityType,
  entityId,
  initialFiles,
  allowPublicToggle = false,
}: {
  entityType: AttachableEntityType;
  entityId: string;
  initialFiles: FileRow[];
  /** Only meaningful for entityType "proposal"/"contract"/"approval"/"project"
   * - shows a checkbox that marks the upload visible on the matching public
   * page. */
  allowPublicToggle?: boolean;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState(false);
  const [versionHistory, setVersionHistory] = useState<Record<string, VersionRow[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);
  const [supersedingId, setSupersedingId] = useState<string | null>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    if (allowPublicToggle && makePublic) {
      formData.append("isPublic", "true");
    }

    startTransition(async () => {
      try {
        await uploadFile(entityType, entityId, formData);
        setFiles((prev) => [
          {
            attachmentId: crypto.randomUUID(),
            fileId: crypto.randomUUID(),
            originalName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            createdAt: new Date().toISOString(),
            label: null,
            versionNumber: 1,
          },
          ...prev,
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao enviar arquivo.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function handleUploadNewVersion(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supersedingId) return;
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        await uploadFile(entityType, entityId, formData, supersedingId);
        setFiles((prev) =>
          prev.map((f) =>
            f.attachmentId === supersedingId
              ? {
                  ...f,
                  originalName: file.name,
                  sizeBytes: file.size,
                  mimeType: file.type,
                  versionNumber: (f.versionNumber ?? 1) + 1,
                }
              : f,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao enviar nova versão.");
      } finally {
        setSupersedingId(null);
        if (versionInputRef.current) versionInputRef.current.value = "";
      }
    });
  }

  function handleToggleHistory(attachmentId: string) {
    if (versionHistory[attachmentId]) {
      setVersionHistory((prev) => {
        const next = { ...prev };
        delete next[attachmentId];
        return next;
      });
      return;
    }
    startTransition(async () => {
      try {
        const history = await getFileVersionHistory(attachmentId);
        setVersionHistory((prev) => ({ ...prev, [attachmentId]: history }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao buscar histórico.");
      }
    });
  }

  function handleDownload(fileId: string) {
    startTransition(async () => {
      try {
        const url = await getFileDownloadUrl(fileId);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao gerar link de download.");
      }
    });
  }

  function handleDelete(attachmentId: string) {
    startTransition(async () => {
      try {
        await deleteFile(attachmentId);
        setFiles((prev) => prev.filter((f) => f.attachmentId !== attachmentId));
        setConfirmDeleteId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao remover arquivo.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <FileUpload ref={inputRef} onChange={handleUpload} disabled={isPending} />
        {allowPublicToggle && (
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={makePublic}
              onChange={(e) => setMakePublic(e.target.checked)}
            />
            Visível na página pública
          </label>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <input
        ref={versionInputRef}
        type="file"
        className="hidden"
        onChange={handleUploadNewVersion}
        disabled={isPending}
      />

      {files.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum arquivo anexado.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.attachmentId} className="rounded-control border border-pulso-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={18} className="shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {file.originalName}
                      {file.versionNumber && file.versionNumber > 1 && (
                        <span className="ml-1 text-xs text-slate-400">v{file.versionNumber}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{formatSize(file.sizeBytes)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => handleDownload(file.fileId)}
                    aria-label={`Baixar ${file.originalName}`}
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => {
                      setSupersedingId(file.attachmentId);
                      versionInputRef.current?.click();
                    }}
                    aria-label={`Enviar nova versão de ${file.originalName}`}
                    title="Enviar nova versão"
                  >
                    <Upload size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => handleToggleHistory(file.attachmentId)}
                    aria-label={`Ver histórico de versões de ${file.originalName}`}
                    title="Histórico de versões"
                  >
                    <History size={16} />
                  </Button>
                  {confirmDeleteId === file.attachmentId ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(file.attachmentId)}
                    >
                      Confirmar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => setConfirmDeleteId(file.attachmentId)}
                      aria-label={`Remover ${file.originalName}`}
                      className="text-pulso-error hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>

              {versionHistory[file.attachmentId] && (
                <ul className="mt-2 space-y-1 border-t border-pulso-border pt-2">
                  {versionHistory[file.attachmentId].map((v) => (
                    <li key={v.attachmentId} className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        v{v.versionNumber} — {v.originalName}
                        {v.isCurrent && " (atual)"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownload(v.fileId)}
                        className="text-orange-600 hover:underline"
                      >
                        Baixar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
