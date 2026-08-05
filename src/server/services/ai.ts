/**
 * CRM-F5-08: cliente mínimo da API Anthropic via fetch, sem SDK novo (mesmo
 * espírito de "resolver com o que já temos" já usado no parser CSV/OFX).
 * Mesmo padrão de credencial ausente de `storage/s3.ts` - lança erro claro
 * em vez de mascarar; sem ANTHROPIC_API_KEY configurada neste ambiente,
 * `requestTicketSummarySuggestion` falha nesta chamada, não silenciosamente.
 */
function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} não configurado. Sugestões de IA exigem ANTHROPIC_API_KEY (ver .env.example).`,
    );
  }
  return value;
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

/** Só texto simples - quem chama decide o formato pedido no prompt (ex.:
 * "responda em JSON") e faz o parse; esta função não interpreta a resposta. */
export async function callAnthropicMessages(prompt: string, maxTokens = 512): Promise<string> {
  const apiKey = readEnv("ANTHROPIC_API_KEY");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API respondeu ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const block = data.content?.find((c) => c.type === "text");
  if (!block?.text) throw new Error("Resposta da IA em formato inesperado.");
  return block.text;
}
