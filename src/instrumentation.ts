import { logger } from "./server/logger";

/**
 * CRM-F0-09: fecha o gap real de correlação encontrado nesta sessão -
 * src/app/error.tsx e global-error.tsx mostram error.digest ao usuário, mas
 * são "use client" (o console.error deles roda no navegador, nunca chega ao
 * log do servidor). Sem este hook, o "código de referência" mostrado na tela
 * de erro amigável nunca aparecia em log nenhum consultável via
 * `docker service logs` (docs/ARCHITECTURE_AND_STANDARDS.md §11) - o suporte
 * não tinha como localizar o erro real a partir da referência do usuário.
 *
 * Assinatura estrutural do hook `onRequestError` do Next.js (App Router) -
 * detectado pelo nome exportado, não por um tipo importado de `next/dist/*`
 * (caminho interno, evitado de propósito para não depender de estrutura
 * interna que pode mudar entre versões do Next).
 */
export function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string },
) {
  const digest = (error as { digest?: string } | null)?.digest;
  logger.error("Erro não tratado numa requisição", {
    digest,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    message: error instanceof Error ? error.message : String(error),
  });
}
