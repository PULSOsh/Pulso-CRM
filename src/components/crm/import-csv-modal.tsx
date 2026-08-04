"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export type ImportResult = {
  created: number;
  duplicates: { row: number; reason: string }[];
  invalid: { row: number; error: string }[];
};

export function ImportCsvModal({
  open,
  onClose,
  title,
  headerExample,
  onImport,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  headerExample: string;
  onImport: (csvText: string) => Promise<ImportResult>;
  onImported: () => void;
}) {
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    setCsvText("");
    setResult(null);
    setError(null);
    onClose();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvText(await file.text());
  }

  async function handleImport() {
    setLoading(true);
    setError(null);
    try {
      const importResult = await onImport(csvText);
      setResult(importResult);
      if (importResult.created > 0) onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar CSV.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description="Cole o conteúdo de um CSV ou selecione um arquivo. Linhas duplicadas (já cadastradas) são ignoradas automaticamente."
    >
      <div className="space-y-3">
        <div className="rounded-md bg-slate-50 p-3 text-xs font-mono text-slate-600">
          {headerExample}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="text-sm"
        />

        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={8}
          placeholder="Cole o CSV aqui..."
          className="w-full rounded-md border border-slate-200 p-2 text-sm font-mono"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="rounded-md border border-slate-200 p-3 text-sm space-y-2">
            <p className="font-medium text-green-700">{result.created} contato(s) criado(s).</p>
            {result.duplicates.length > 0 && (
              <div>
                <p className="font-medium text-amber-700">
                  {result.duplicates.length} duplicado(s) ignorado(s):
                </p>
                <ul className="list-disc pl-5 text-slate-600">
                  {result.duplicates.map((d) => (
                    <li key={d.row}>
                      Linha {d.row}: {d.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.invalid.length > 0 && (
              <div>
                <p className="font-medium text-red-700">{result.invalid.length} linha(s) inválida(s):</p>
                <ul className="list-disc pl-5 text-slate-600">
                  {result.invalid.map((d) => (
                    <li key={d.row}>
                      Linha {d.row}: {d.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {result ? "Fechar" : "Cancelar"}
          </Button>
          {!result && (
            <Button type="button" disabled={loading || !csvText.trim()} onClick={handleImport}>
              {loading ? "Importando..." : "Importar"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
