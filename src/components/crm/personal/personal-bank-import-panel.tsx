"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  createPersonalBankImport,
  getPersonalBankImportLines,
  getPersonalReconciliationCandidates,
  ignorePersonalBankImportLine,
  matchPersonalBankImportLine,
  unmatchPersonalBankImportLine,
} from "@/server/actions/personal-bank-imports";

type BankImport = {
  id: string;
  fileName: string;
  format: string;
  importedAt: string | Date;
  totalLines: number;
  matchedLines: number;
};
type Account = { id: string; name: string };
type BankImportLine = Awaited<ReturnType<typeof getPersonalBankImportLines>>[number];
type Candidate = Awaited<ReturnType<typeof getPersonalReconciliationCandidates>>[number];

function currency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
}

function LineRow({ line }: { line: BankImportLine }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);

  function loadCandidates() {
    startTransition(async () => {
      const result = await getPersonalReconciliationCandidates(line.id);
      setCandidates(result);
    });
  }

  function handleMatch(transactionId: string) {
    startTransition(async () => {
      await matchPersonalBankImportLine(line.id, transactionId);
      router.refresh();
    });
  }

  function handleIgnore() {
    startTransition(async () => {
      await ignorePersonalBankImportLine(line.id);
      router.refresh();
    });
  }

  function handleUnmatch() {
    startTransition(async () => {
      await unmatchPersonalBankImportLine(line.id);
      router.refresh();
    });
  }

  return (
    <li className="rounded-control border border-pulso-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{line.description}</p>
          <p className="text-xs text-slate-500">
            {new Date(line.lineDate).toLocaleDateString("pt-BR")} · {currency(line.amount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {line.status === "unmatched" && (
            <>
              <Button size="sm" variant="outline" onClick={loadCandidates} disabled={isPending}>
                Ver sugestões
              </Button>
              <Button size="sm" variant="ghost" onClick={handleIgnore} disabled={isPending}>
                Ignorar
              </Button>
            </>
          )}
          {line.status === "matched" && (
            <>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Conciliado
              </span>
              <Button size="sm" variant="ghost" onClick={handleUnmatch} disabled={isPending}>
                Desfazer
              </Button>
            </>
          )}
          {line.status === "ignored" && (
            <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs text-slate-500">
              Ignorado
            </span>
          )}
        </div>
      </div>

      {candidates && (
        <ul className="mt-3 space-y-1">
          {candidates.length === 0 ? (
            <li className="text-xs text-slate-500">Nenhum lançamento compatível encontrado.</li>
          ) : (
            candidates.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-xs text-slate-700">
                <span>
                  {c.description} — {currency(c.amount)} ·{" "}
                  {new Date(c.occurredAt).toLocaleDateString("pt-BR")}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMatch(c.id)}
                  disabled={isPending}
                >
                  Casar
                </Button>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  );
}

function ImportLines({ importId }: { importId: string }) {
  const [lines, setLines] = useState<BankImportLine[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const result = await getPersonalBankImportLines(importId);
      setLines(result);
    });
  }

  if (lines === null) {
    return (
      <Button size="sm" variant="ghost" onClick={load} disabled={isPending}>
        Ver lançamentos
      </Button>
    );
  }

  return (
    <ul className="mt-3 space-y-2">
      {lines.map((line) => (
        <LineRow key={line.id} line={line} />
      ))}
    </ul>
  );
}

export function PersonalBankImportPanel({
  imports,
  accounts,
}: {
  imports: BankImport[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const format = file.name.toLowerCase().endsWith(".ofx") ? "ofx" : "csv";
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      startTransition(async () => {
        try {
          await createPersonalBankImport({
            fileName: file.name,
            format,
            accountId: accountId || undefined,
            content,
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro ao importar arquivo.");
        }
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-medium text-slate-900">Importação de extrato (CSV/OFX)</h2>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Conta (opcional)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.ofx"
            onChange={handleFileChange}
            disabled={isPending}
            className="text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {imports.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma importação realizada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {imports.map((imp) => (
            <li key={imp.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{imp.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {imp.format.toUpperCase()} ·{" "}
                    {new Date(imp.importedAt).toLocaleDateString("pt-BR")} · {imp.matchedLines}/
                    {imp.totalLines} conciliados
                  </p>
                </div>
              </div>
              <ImportLines importId={imp.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
