# CRM-F5-08 — IA assistida e auditável

Status: Done (implementado 2026-08-05) - primeiro caso de uso, sem credencial validada neste ambiente

## Objetivo

Introduzir o primeiro uso real de IA no sistema respeitando as duas regras do Módulo O do plano mestre: só categorias permitidas (resumo/classificação) e nunca executar ação crítica sem confirmação humana.

## Escopo

- `ai_suggestions` (novo): toda chamada de IA fica registrada com `status` começando `pending`, nunca aplicada sozinha.
- `services/ai.ts`: cliente mínimo da API Anthropic via `fetch` (sem SDK novo), mesmo padrão de credencial ausente já usado em `storage/s3.ts` (`readEnv` lança erro claro se `ANTHROPIC_API_KEY` não estiver configurada, em vez de mascarar ou mockar).
- `requestTicketSummarySuggestion(ticketId)`: único caso de uso implementado - pede à IA um resumo + categoria de um chamado, a partir só do que já é visível a quem tem `tickets.read` (nunca dado financeiro/pessoal).
- `acceptAiSuggestion`/`rejectAiSuggestion`: a confirmação humana explícita do gate da fase. Aceitar aplica algo real, mas só uma nota interna no chamado (nunca resposta enviada ao cliente sozinha, nunca mudança de status/prioridade/atribuição) - reversível e de baixo risco por design.
- Toda decisão (aceitar/rejeitar) grava em `audit_logs`.

## Achado

Não havia nenhuma integração de LLM no repositório antes desta story - nem `ANTHROPIC_API_KEY` nem `OPENAI_API_KEY` configuradas neste ambiente. Mesma situação já enfrentada com S3 (upload de arquivo, Fase 1): o código é construído e correto, mas só é validável de fato com a credencial em produção.

## Fora de escopo

- Qualquer outro caso de uso de IA (detecção de duplicidade, rascunho de proposta, etc.) - um caso de uso implementado bem, não vários pela metade.
- Aplicar a sugestão automaticamente sem clique humano - proibido pelo gate da fase, nunca considerado.
- Envio de dado financeiro/pessoal para o modelo - `inputSummary` só contém assunto/descrição/comentários do chamado, nada de `expenses`/`personal_transactions`/receita.

## Critérios de aceite verificáveis

- Sem `ANTHROPIC_API_KEY` configurada, a chamada falha com mensagem clara (`"ANTHROPIC_API_KEY não configurado..."`), nunca silenciosamente.
- Uma sugestão só é aplicada (nota interna criada) depois de `acceptAiSuggestion` - nunca antes.
- Uma sugestão já decidida não pode ser decidida de novo.
- Tipos e build passam.

## Regras de autorização

`ai.use` (nova, `admin`/`owner` automaticamente via filtro).

## Alterações de banco

Tabela `ai_suggestions` (nova) + enum `ai_suggestion_status`, parte de `0013_fase5_atendimento_automacao_base.sql`.

## Riscos

Sem `ANTHROPIC_API_KEY` real, este recurso está construído mas não pode ser exercitado de ponta a ponta neste ambiente - mesmo débito de toda sessão para funcionalidades que dependem de credencial externa (S3, agora também Anthropic).

## Dev Agent Record

### File List

- `src/server/db/schema/ai.ts`, `src/server/db/schema/enums.ts`.
- `src/server/services/ai.ts` — novo.
- `src/server/actions/ai-suggestions.ts` — novo.
- `src/components/crm/tickets/tickets-client.tsx` — botão de sugestão de IA integrado ao painel de detalhe do chamado.

### Completion Notes

`tsc --noEmit`, `next build` — verdes. Chamada real à API Anthropic não testada (sem `ANTHROPIC_API_KEY` neste ambiente) - o caminho de erro por credencial ausente é o único exercitável aqui.
