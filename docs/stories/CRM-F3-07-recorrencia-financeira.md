# CRM-F3-07 — Recorrência financeira

Status: Done (implementado 2026-08-05) - geração manual, sem motor de automação

## Objetivo

Cadastrar uma vez uma despesa/receita que se repete (assinatura de software, retainer de cliente) e gerar a parcela do período sem redigitar os dados a cada mês.

## Achado

Já existia recorrência para tarefas (`task-recurrences.ts`, `calculateNextDueDate`), mas nada equivalente para o financeiro. `calculateNextDueDate` (pure function, `daily|weekly|monthly`) foi reaproveitada em vez de reescrita.

## Escopo

- `financial_recurrence_rules` (novo): alvo (`receivable`|`payable`), frequência, data de início/fim, próxima execução, valor, vínculos opcionais (fornecedor/cliente/categoria/centro de custo/projeto).
- `generateNextRecurrenceOccurrence(ruleId)`: cria um recebível/pagável de parcela única com vencimento em `nextRunDate` e avança a regra para a data seguinte - **sem motor de automação/job agendado nesta fase** (isso é Fase 5 do plano mestre, "Automação"). A equipe gera sob demanda.
- UI (`RecurrencesPanel`) com aviso explícito de que a geração é manual.

## Fora de escopo

- Execução automática agendada (cron) - explicitamente fora até a Fase 5.
- Recorrência com valor variável (ex.: reajuste anual automático).

## Critérios de aceite verificáveis

- Gerar a próxima ocorrência de uma regra desativada é rejeitado.
- Gerar a próxima ocorrência de uma regra já encerrada (`endDate` passado) é rejeitado.
- Cada geração avança `nextRunDate` corretamente pela frequência configurada.
- Tipos, testes e build passam.

## Regras de autorização

`financial_recurrences.read`/`financial_recurrences.manage` (novas).

## Alterações de banco

Tabela `financial_recurrence_rules` (nova) + enum `financial_recurrence_target`, parte de `0011_fase3_financeiro_base.sql`.

## Riscos

Débito explícito: sem job agendado, a geração depende de alguém lembrar de clicar "Gerar próxima" - se isso se tornar operacionalmente importante, precisa da Fase 5 (motor de automação) antes de confiar nisso para algo crítico.

## Dev Agent Record

### File List

- `src/server/db/schema/ledger.ts` - `financialRecurrenceRules`.
- `src/server/actions/financial-recurrences.ts` + `.schemas.ts` + `.schemas.test.ts` - novos.
- `src/components/crm/finance/recurrences-panel.tsx` - novo.

### Completion Notes

`tsc --noEmit`, `vitest run` (154/154), `biome check`, `next build` - todos verdes.
