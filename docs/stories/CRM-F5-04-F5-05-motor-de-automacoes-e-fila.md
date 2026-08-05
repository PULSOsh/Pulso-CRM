# CRM-F5-04/F5-05 — Motor de automações e fila/retry/dead-letter

Status: Done (implementado 2026-08-05)

## Objetivo

Reagir a eventos de negócio (oportunidade ganha/perdida, chamado criado) com ações seguras e automáticas, de forma idempotente, observável e reversível (gate da Fase 5).

## Achado

`outbox_events`/`idempotency_keys` já existiam desde a migration `0000` (produção), mas nenhuma linha jamais foi inserida - eram um esqueleto pronto, nunca usado. F5-04/F5-05 são a primeira implementação real sobre essa base: `outbox_events` vira o razão de eventos consumido sob demanda; `idempotency_keys` (genérica, pensada para hash de request HTTP) foi avaliada e descartada em favor de uma constraint unique direta em `automation_runs (ruleId, idempotencyKey)`, mais simples para este caso.

## Escopo

- `automation_rules` (regra: gatilho + condições simples + até 5 ações) + `automation_runs` (execução: idempotente por `ruleId`+contexto, status success/failed/dead_letter, tentativas, último erro).
- `services/automation.ts` (`evaluateConditions`, pure function testada) - condições `{campo, operador, valor}` em memória, nunca SQL dinâmico.
- Só 3 tipos de ação, todas seguras/reversíveis (docs/PLANO_MESTRE_EVOLUCAO_CRM.md §5 Módulo O): notificar usuário, criar tarefa, enviar webhook. Nunca aprova, assina, exclui ou movimenta dinheiro.
- `enqueueOutboxEvent` (novo, `services/outbox.ts`) chamado em 2 pontos reais e já significativos: `winOpportunity`/`loseOpportunity` (opportunities.ts) e `createTicket`/`createPortalTicket` (tickets.ts) - uma linha adicional em cada, dentro da transação já existente.
- `processPendingAutomations()`: sem worker/job agendado neste ambiente (mesmo padrão "geração manual" de recorrências financeiras/pessoais) - processa um lote de eventos pendentes sob demanda, via botão na UI.
- Retry: até 5 tentativas por regra+evento; na 5ª falha vira `dead_letter` (nunca mais reprocessado automaticamente, mas visível na fila).

## Fora de escopo

- Gatilho `ticket_sla_breached` emitido automaticamente - existe no enum e é aceito por uma regra, mas nada dispara esse evento ainda (exigiria uma verificação periódica de SLA vencido, que não existe sem job agendado). Documentado como gap, não fingido como implementado.
- Editor visual de condições - é uma lista JSON simples criada pela UI, um campo/operador/valor por vez.

## Critérios de aceite verificáveis

- A mesma regra nunca executa duas vezes para o mesmo evento (constraint unique).
- Uma ação que falha 5 vezes vira `dead_letter` e para de ser tentada automaticamente.
- `processPendingAutomations` sempre marca o evento como processado, mesmo se uma regra específica falhar (o run fica registrado como `failed`, não trava a fila inteira).
- Tipos, testes (condições) e build passam.

## Regras de autorização

`automation.read`/`automation.manage`/`automation.run` (novas, `admin`/`owner` automaticamente via filtro; nenhum outro papel).

## Alterações de banco

Tabelas `automation_rules`/`automation_runs` (novas) + enums `automation_trigger`/`automation_action_type`/`automation_run_status`, parte de `0013_fase5_atendimento_automacao_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/automation.ts`, `src/server/db/schema/enums.ts`.
- `src/server/services/automation.ts` + `.test.ts`, `src/server/services/outbox.ts` — novos.
- `src/server/actions/automation-rules.ts` + `.schemas.ts` + `.schemas.test.ts`, `src/server/actions/automation-engine.ts` — novos.
- `src/server/actions/opportunities.ts`, `src/server/actions/tickets.ts` — `enqueueOutboxEvent` nos pontos de gatilho.
- `src/components/crm/automation/automation-client.tsx`, `src/app/crm/automacoes/page.tsx` — novos.

### Completion Notes

`tsc --noEmit`, `vitest run` (205/205), `biome check`, `next build` — todos verdes. Verificação com dado real (evento real disparando uma automação de ponta a ponta) não realizada - sem banco neste ambiente.
