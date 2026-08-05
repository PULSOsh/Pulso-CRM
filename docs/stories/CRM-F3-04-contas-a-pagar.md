# CRM-F3-04 — Contas a pagar

Status: Done (implementado 2026-08-05)

## Objetivo

Registrar o que a PULSO deve pagar (fornecedores, despesas com vencimento), com baixa e estorno, no mesmo padrão já validado dos recebíveis.

## Achado

`expenses` (módulo de lucratividade) é o mais próximo que existia, mas não tem vencimento separado da competência, vínculo a fornecedor, parcelamento, nem uma action de "marcar como pago" - `status` fica travado em `"planned"` desde a criação. Contas a pagar é uma entidade nova, deliberadamente separada de `expenses` (que continua servindo só à lucratividade).

## Escopo

- `payables` + `payable_installments` (novo), mesmo padrão de `receivables`/`installments` (cabeçalho + parcelas).
- `createPayable` (valida `vendorCompanyId` pertence à organização), `getPayables`, `markPayableInstallmentPaid` (baixa parcial acumulativa, F3-06), `reversePayableInstallmentPayment`, `refreshOverduePayableInstallments`.
- Toda baixa/estorno escreve no razão (`financial_transactions`, F3-05).
- UI (`PayablesPanel`) na aba "Contas a pagar".

## Fora de escopo

- Aprovação/alçada para pagamentos (fica interna, sem workflow de aprovação nesta fase).
- Nota fiscal/XML de entrada.

## Critérios de aceite verificáveis

- Criar uma conta a pagar com fornecedor de outra organização é rejeitado.
- Somar as baixas de uma parcela acima do valor da parcela é rejeitado.
- Baixar todas as parcelas de uma conta a pagar marca a conta como paga.
- Tipos, testes e build passam.

## Regras de autorização

`payables.read`/`payables.create`/`payables.mark_paid`/`payables.reverse`/`payables.cancel` (novas, papel `finance`).

## Alterações de banco

Tabelas `payables`/`payable_installments` (novas) + enum `payable_status`, parte de `0011_fase3_financeiro_base.sql`, não aplicada.

## Dev Agent Record

### File List

- `src/server/db/schema/ledger.ts` - `payables`, `payableInstallments`.
- `src/server/actions/payables.ts` + `.schemas.ts` + `.schemas.test.ts` - novos.
- `src/server/services/installment-status.ts` - `deriveInstallmentStatus` (compartilhado com F3-06).
- `src/server/services/ledger.ts` - `postFinancialTransaction` (compartilhado com F3-05).
- `src/components/crm/finance/payables-panel.tsx` - novo.

### Completion Notes

`tsc --noEmit`, `vitest run` (154/154), `biome check`, `next build` - todos verdes.
