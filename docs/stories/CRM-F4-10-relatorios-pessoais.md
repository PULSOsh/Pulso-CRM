# CRM-F4-10 — Relatórios pessoais

Status: Done (implementado 2026-08-05)

## Objetivo

Fluxo de caixa mensal e gasto por categoria, complementando patrimônio (F4-07) e calendário (F4-09) no mesmo painel de relatórios.

## Escopo

- `getPersonalCashFlowReport(days)`: receita/despesa mensal, direto de `personal_transactions` - sem "projeção" separada (uma parcela futura já É um lançamento com `occurredAt` futuro, diferente do razão empresarial que precisa somar parcelas abertas separadamente).
- `getPersonalSpendingByCategory(days)`: gasto por categoria no período, ordenado do maior para o menor.

## Fora de escopo

- Comparação ano a ano / metas de economia automáticas.
- Exportação (CSV/PDF) dos relatórios.

## Critérios de aceite verificáveis

- Transferências (`transfer_in`/`transfer_out`) não entram como receita/despesa no fluxo de caixa (só `income`/`expense`).
- Categoria sem nome (excluída/nula) aparece agrupada como "Sem categoria".
- Tipos e build passam.

## Regras de autorização

`requirePersonalAccess("read")`.

## Alterações de banco

Nenhuma.

## Dev Agent Record

### File List

- `src/server/actions/personal-reports.ts` — `getPersonalCashFlowReport`, `getPersonalSpendingByCategory`.
- `src/components/crm/personal/personal-reports-panel.tsx`.

### Completion Notes

`tsc --noEmit`, `next build` — verdes. Sem dado real para validar os números (sem banco neste ambiente).
