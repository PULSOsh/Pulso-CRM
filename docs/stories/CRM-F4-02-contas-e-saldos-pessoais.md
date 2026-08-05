# CRM-F4-02 — Contas e saldos pessoais

Status: Done (implementado 2026-08-05)

## Objetivo

Cadastrar contas pessoais (corrente, carteira, investimento) para vincular lançamentos e transferências.

## Escopo

- `personal_accounts` (novo), CRUD (`createPersonalAccount`/`deactivatePersonalAccount`/`getPersonalAccounts`), gated por `requirePersonalAccess`.
- Saldo é sempre derivado somando `personal_transactions` da conta (entradas menos saídas) — nunca um campo próprio que pode dessincronizar, mesmo princípio já usado no razão empresarial (Fase 3).

## Fora de escopo

- Saldo de abertura configurável — hoje o saldo assume zero na criação da conta (débito conhecido, documentado no relatório de patrimônio).

## Critérios de aceite verificáveis

- Contas de outra organização nunca aparecem na listagem (`organizationId` sempre filtrado).
- Desativar uma conta não afeta lançamentos já existentes.
- Tipos, testes e build passam.

## Regras de autorização

`requirePersonalAccess("read"/"manage")` — sem chave de permissão nova.

## Alterações de banco

Tabela `personal_accounts` (nova), parte de `0012_fase4_financas_pessoais_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/personal-finance.ts` — `personalAccounts`.
- `src/server/actions/personal-accounts.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/personal/personal-accounts-panel.tsx` — novo (inclui transferência, F4-03).

### Completion Notes

`tsc --noEmit`, `vitest run` (180/180), `biome check`, `next build` — todos verdes.
