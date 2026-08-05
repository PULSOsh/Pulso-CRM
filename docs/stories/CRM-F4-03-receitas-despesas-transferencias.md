# CRM-F4-03 — Receitas, despesas e transferências pessoais

Status: Done (implementado 2026-08-05)

## Objetivo

Registrar o bookkeeping pessoal do dia a dia: receitas, despesas e transferências entre contas próprias.

## Escopo

- `personal_categories` (novo, `kind: income|expense`) + `personal_transactions` (novo).
- `createPersonalTransaction`/`updatePersonalTransaction`/`deletePersonalTransaction`/`getPersonalTransactions`.
- `createPersonalTransfer`: duas linhas (`transfer_out`/`transfer_in`) ligadas por `transferGroupId`, sempre as duas juntas.
- **CRUD simples, sem razão imutável**: diferente do financeiro empresarial (Fase 3), aqui não há exigência de "histórico confiável" — é bookkeeping pessoal informal, editar/excluir direto é aceitável.

## Fora de escopo

- Anexos/comprovante por lançamento pessoal (poderia reaproveitar `attachments`, mas não foi pedido nesta fase).
- Divisão de um lançamento entre múltiplas categorias (split).

## Critérios de aceite verificáveis

- Transferir para a mesma conta de origem e destino é rejeitado.
- Excluir um lançamento de outra organização é rejeitado.
- Tipos, testes e build passam.

## Regras de autorização

`requirePersonalAccess("read"/"manage")`.

## Alterações de banco

Tabelas `personal_categories`/`personal_transactions` (novas) + enums `personal_transaction_kind`/`personal_category_kind`, parte de `0012_fase4_financas_pessoais_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/personal-finance.ts`, `src/server/db/schema/enums.ts`.
- `src/server/actions/personal-categories.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/server/actions/personal-transactions.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/personal/personal-transactions-panel.tsx` — novo.

### Completion Notes

`tsc --noEmit`, `vitest run` (180/180), `biome check`, `next build` — todos verdes.
