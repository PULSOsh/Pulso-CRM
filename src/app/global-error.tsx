"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error("Erro global inesperado no CRM", error), [error]);
  return (
    <html lang="pt-BR">
      <body>
        <main
          style={{ fontFamily: "system-ui, sans-serif", padding: "48px 24px", textAlign: "center" }}
        >
          <h1>O CRM encontrou um problema</h1>
          <p>Seus dados estão seguros. Tente carregar novamente.</p>
          {error.digest && <p>Referência: {error.digest}</p>}
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "10px 18px" }}>
            Recarregar
          </button>
        </main>
      </body>
    </html>
  );
}
