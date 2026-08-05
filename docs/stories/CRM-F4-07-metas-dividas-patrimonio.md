# CRM-F4-07 — Metas, dívidas e patrimônio

Status: Done (implementado 2026-08-05)

## Objetivo

Acompanhar metas de reserva/objetivo, dívidas em aberto, e um retrato consolidado de patrimônio líquido.

## Escopo

- `personal_goals` (novo): valor-alvo, valor atual, `contributeToPersonalGoal` soma contribuições.
- `personal_debts` (novo): valor total, valor restante, `payPersonalDebt` abate o valor restante e marca `paid` quando chega a zero.
- `getPersonalNetWorth()`: patrimônio = saldo das contas (derivado, F4-02) + metas - dívidas em aberto.

## Fora de escopo

- Cálculo de juros compostos sobre dívidas (`interestRate` existe como campo informativo, sem projeção automática).
- Metas compartilhadas/vinculadas a uma conta específica (o valor da meta é um contador próprio, não reflete saldo real de uma conta).

## Critérios de aceite verificáveis

- Pagar uma dívida com valor igual ao restante marca `status: "paid"`.
- Patrimônio líquido soma corretamente contas + metas - dívidas.
- Tipos, testes e build passam.

## Regras de autorização

`requirePersonalAccess("read"/"manage")`.

## Alterações de banco

Tabelas `personal_goals`/`personal_debts` (novas), parte de `0012_fase4_financas_pessoais_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/personal-finance.ts` — `personalGoals`, `personalDebts`.
- `src/server/actions/personal-goals.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/server/actions/personal-reports.ts` — `getPersonalNetWorth`.
- `src/components/crm/personal/personal-goals-debts-panel.tsx`, `personal-reports-panel.tsx` — novos.

### Completion Notes

`tsc --noEmit`, `vitest run` (180/180), `biome check`, `next build` — todos verdes.
