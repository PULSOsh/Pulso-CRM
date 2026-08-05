# CRM-F4-06 — Orçamento mensal pessoal

Status: Done (implementado 2026-08-05)

## Objetivo

Planejar um valor por categoria de despesa em um mês e comparar com o realizado.

## Escopo

- `personal_budgets` (novo: mês + categoria + valor planejado), `upsertPersonalBudget`.
- `getPersonalBudgetReport(month)`: planejado (tabela) vs. realizado (soma de `personal_transactions` do mês, por categoria). Categorias sem orçamento definido aparecem só no lado realizado, em vez de serem omitidas.

## Fora de escopo

- Orçamento por conta ou por cartão (só por categoria).
- Alerta automático de orçamento excedido (o dado já existe no relatório - `remaining < 0` -, notificação proativa é trabalho futuro).

## Critérios de aceite verificáveis

- Definir o orçamento duas vezes para a mesma categoria/mês atualiza o valor, não duplica a linha.
- Uma categoria com gasto mas sem orçamento aparece no relatório com planejado = 0.
- Tipos, testes e build passam.

## Regras de autorização

`requirePersonalAccess("read"/"manage")`.

## Alterações de banco

Tabela `personal_budgets` (nova, `unique(organizationId, month, categoryId)`), parte de `0012_fase4_financas_pessoais_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/personal-finance.ts` — `personalBudgets`.
- `src/server/actions/personal-budgets.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/personal/personal-budget-panel.tsx` — novo.

### Completion Notes

`tsc --noEmit`, `vitest run` (180/180), `biome check`, `next build` — todos verdes.
