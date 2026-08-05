# CRM-F3-11 — DRE gerencial

Status: Done (implementado 2026-08-05)

## Objetivo

Dar visibilidade de receita, despesa por categoria e resultado num período, em regime de caixa.

## Escopo

- `getDreReport(days)`: receita = soma líquida das transações `receivable_payment` (entradas menos estornos); despesas por categoria = soma líquida das transações `payable_payment`, agrupadas por `expense_categories.name` (via `financial_transactions.categoryId`, herdado do pagável no momento da baixa). Resultado = receita - despesas.
- Depende inteiramente de F3-05 (recebíveis) e F3-04 (pagáveis) escreverem no razão - por isso só existe depois das duas.
- UI (`ReportsPanel`, seção "DRE gerencial") na aba "Relatórios".

## Fora de escopo

- Regime de competência (a data usada é `occurredAt` da transação, ou seja, quando o dinheiro efetivamente moveu, não a data de competência do pagável/recebível).
- Rateio de despesas sem categoria/centro de custo definido em "outros" com alerta - hoje aparecem como "Sem categoria", visível mas sem tratamento especial.

## Critérios de aceite verificáveis

- Um estorno de recebimento reduz a receita do período (não aparece como uma segunda linha positiva).
- Despesas sem categoria aparecem agrupadas como "Sem categoria" em vez de serem omitidas.
- Tipos e build passam.

## Regras de autorização

Reaproveita `reports.finance`.

## Alterações de banco

Nenhuma.

## Dev Agent Record

### File List

- `src/server/actions/reports.ts` - `getDreReport`.
- `src/components/crm/finance/reports-panel.tsx` - seção de DRE.

### Completion Notes

`tsc --noEmit`, `next build` - verdes.
