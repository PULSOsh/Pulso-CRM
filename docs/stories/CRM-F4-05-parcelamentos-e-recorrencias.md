# CRM-F4-05 — Parcelamentos e recorrências pessoais

Status: Done (implementado 2026-08-05) - geração manual, sem motor de automação

## Objetivo

Lançar uma compra parcelada de uma vez (gerando as N parcelas mensais) e cadastrar despesas/receitas recorrentes sem redigitar todo mês.

## Escopo

- Parcelamento: `createPersonalTransaction` aceita `installments` (1-60) — divide o valor em N linhas mensais compartilhando `installmentGroupId`, datas avançadas via `calculateNextDueDate` (reaproveitado de `task-recurrences`). Sem tabela própria de parcelamento.
- `personal_recurrences` (novo) + `generateNextPersonalOccurrence` — mesmo padrão de `financial_recurrence_rules` (Fase 3): geração manual sob demanda, sem job agendado (Fase 5 do plano mestre).

## Fora de escopo

- Excluir/editar um parcelamento inteiro de uma vez (hoje é linha por linha) — débito conhecido.
- Motor de automação para gerar recorrências sozinho.

## Critérios de aceite verificáveis

- Um parcelamento em 12x gera exatamente 12 lançamentos, cada um com 1/12 do valor total e vencimento mensal sequencial.
- Gerar a próxima ocorrência de uma regra desativada ou já encerrada é rejeitado.
- Tipos, testes e build passam.

## Regras de autorização

`requirePersonalAccess("read"/"manage")`.

## Alterações de banco

Tabela `personal_recurrences` (nova) + colunas `installmentGroupId`/`installmentNumber`/`installmentTotal` em `personal_transactions`, parte de `0012_fase4_financas_pessoais_base.sql`.

## Dev Agent Record

### File List

- `src/server/actions/personal-transactions.ts` — lógica de parcelamento em `createPersonalTransaction`.
- `src/server/db/schema/personal-finance.ts` — `personalRecurrences`.
- `src/server/actions/personal-recurrences.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/personal/personal-recurrences-panel.tsx` — novo.

### Completion Notes

`tsc --noEmit`, `vitest run` (180/180), `biome check`, `next build` — todos verdes.
