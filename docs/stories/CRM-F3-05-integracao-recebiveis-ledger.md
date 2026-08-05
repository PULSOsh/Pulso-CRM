# CRM-F3-05 — Integração dos recebíveis existentes ao razão financeiro

Status: Done (implementado 2026-08-05)

## Objetivo

Fazer o fluxo de recebíveis já funcional (`finance.ts`, desde a Fase 1) passar a alimentar o novo razão único (`financial_transactions`), para que fluxo de caixa (F3-10), DRE (F3-11) e conciliação (F3-09) tenham dado real a partir do dia um, sem esperar nenhuma migração de dados.

## Escopo

- `markInstallmentPaid` passa a: (1) aceitar baixa parcial acumulativa (soma ao `paidAmount` existente, ver F3-06); (2) aceitar `accountId` opcional; (3) escrever uma linha em `financial_transactions` (`kind: "receivable_payment"`, `direction: "in"`) a cada chamada, na mesma transação.
- `reverseInstallmentPayment` passa a aceitar `amount` opcional (reversão parcial) e escreve uma linha de reversão (`direction: "out"`) em vez de só editar a parcela - "estorno como evento inverso" nunca apaga o que foi lançado.
- Nenhuma migração de dados histórica - só lançamentos novos a partir desta story alimentam o razão (dados anteriores continuam corretos em `installments`, só não aparecem retroativamente em `financial_transactions`).

## Fora de escopo

- Backfill de `financial_transactions` a partir do histórico de `installments` já pago - não há histórico real em produção que justifique o custo agora (banco de produção não foi tocado nesta sessão).

## Critérios de aceite verificáveis

- Cada baixa (total ou parcial) gera exatamente uma linha no razão.
- Cada estorno (total ou parcial) gera exatamente uma linha no razão com direção invertida.
- A soma de todas as linhas do razão de uma parcela reflete o `paidAmount` atual da parcela.
- Tipos, testes e build passam.

## Regras de autorização

Sem chaves novas - reaproveita `finance.mark_paid`/`finance.reverse` já existentes.

## Alterações de banco

Nenhuma além da tabela `financial_transactions` (F3-02/schema base) já coberta em `0011_fase3_financeiro_base.sql`.

## Dev Agent Record

### File List

- `src/server/actions/finance.ts` - `markInstallmentPaid`/`reverseInstallmentPayment` reescritos.
- `src/server/services/installment-status.ts`, `src/server/services/ledger.ts` - reaproveitados de F3-04.

### Completion Notes

`tsc --noEmit`, `vitest run` (154/154), `biome check`, `next build` - todos verdes. Comportamento anterior (baixa/estorno total) preservado - a mudança é estritamente aditiva no uso (chamar como antes ainda funciona; parcial é opt-in ao informar um valor menor que o restante).
