# CRM-F4-04 — Cartões e faturas pessoais

Status: Done (implementado 2026-08-05)

## Objetivo

Acompanhar cartões de crédito pessoais e o pagamento das faturas mensais.

## Escopo

- `personal_credit_cards` (novo: dia de fechamento/vencimento, limite).
- `personal_transactions.creditCardId` (opcional) vincula uma despesa a um cartão.
- `getCreditCardInvoices(cardId, monthsBack)`: o valor da fatura é sempre **derivado** somando os lançamentos do mês vinculados ao cartão — nunca duplicado numa coluna própria.
- `personal_credit_card_invoices` (novo): só registra o status de pagamento (paga/valor pago/data), uma linha por (cartão, mês).
- `payPersonalInvoice`.

## Fora de escopo

- Parcelamento de compra no cartão em múltiplas faturas com juros — parcelamento (F4-05) já cobre "N parcelas mensais", cada uma pode ser vinculada ao cartão do mês correspondente.
- Limite disponível calculado automaticamente (limite existe como campo, sem cálculo de uso ainda).

## Critérios de aceite verificáveis

- O total da fatura de um mês soma exatamente as despesas daquele cartão naquele mês.
- Marcar uma fatura como paga não afeta os lançamentos que a compõem.
- Tipos, testes e build passam.

## Regras de autorização

`requirePersonalAccess("read"/"manage")`.

## Alterações de banco

Tabelas `personal_credit_cards`/`personal_credit_card_invoices` (novas), parte de `0012_fase4_financas_pessoais_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/personal-finance.ts` — `personalCreditCards`, `personalCreditCardInvoices`.
- `src/server/actions/personal-credit-cards.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/personal/personal-cards-panel.tsx` — novo.

### Completion Notes

`tsc --noEmit`, `vitest run` (180/180), `biome check`, `next build` — todos verdes.
