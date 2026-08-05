"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { claimPersonalWorkspace } from "@/server/actions/personal-workspace";

export function ActivateWorkspacePanel() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleActivate() {
    setError(null);
    startTransition(async () => {
      try {
        await claimPersonalWorkspace();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao ativar o espaço pessoal.");
      }
    });
  }

  return (
    <div className="max-w-md mx-auto text-center space-y-4 py-16">
      <h1 className="text-lg font-semibold text-slate-900">Espaço pessoal</h1>
      <p className="text-sm text-slate-500">
        Área privada de finanças pessoais, isolada do financeiro da empresa. Só você (proprietário)
        vai ter acesso, mesmo que outra pessoa receba o papel de owner no futuro.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleActivate} disabled={isPending}>
        Ativar meu espaço pessoal
      </Button>
    </div>
  );
}
