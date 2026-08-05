# CRM-F3-10 — Fluxo de caixa projetado

Status: Done (implementado 2026-08-05)

## Objetivo

Mostrar não só o que já aconteceu (saldo atual), mas o que está previsto para entrar e saír nos próximos meses, a partir do que já está lançado em aberto.

## Escopo

- `getCashFlowReport(monthsAhead)`: saldo atual = soma de todas as linhas do razão (`financial_transactions`, entradas menos saídas, histórico completo - só existe porque F3-05 passou a lançar toda baixa ali). Projeção por mês = entradas previstas (parcelas de recebível abertas, por vencimento) menos saídas previstas (parcelas de pagável abertas, por vencimento), acumulado sobre o saldo atual.
- UI (`ReportsPanel`, seção "Fluxo de caixa projetado") na aba "Relatórios".

## Fora de escopo

- Cenários (otimista/pessimista) - só a projeção linear do que já está cadastrado.
- Inclusão de recorrências (F3-07) ainda não geradas na projeção - só entra no fluxo o que já foi efetivamente lançado como parcela.

## Critérios de aceite verificáveis

- O saldo projetado do primeiro mês = saldo atual + entradas do mês - saídas do mês.
- Parcelas já pagas/canceladas não entram nas entradas/saídas previstas.
- Tipos e build passam.

## Regras de autorização

Reaproveita `reports.finance` já existente.

## Alterações de banco

Nenhuma - relatório de leitura sobre tabelas já existentes.

## Dev Agent Record

### File List

- `src/server/actions/reports.ts` - `getCashFlowReport`.
- `src/components/crm/finance/reports-panel.tsx` - seção de fluxo de caixa.

### Completion Notes

`tsc --noEmit`, `next build` - verdes. Sem dado real para validar os números (sem banco neste ambiente) - a lógica de agregação foi revisada manualmente linha a linha.
