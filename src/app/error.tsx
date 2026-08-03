"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error("Erro inesperado no CRM", error), [error]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">PULSO CRM</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Tivemos uma falha inesperada. Tente novamente; se continuar, envie o código de referência
          ao suporte.
        </p>
        {error.digest && (
          <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600">
            Referência: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
