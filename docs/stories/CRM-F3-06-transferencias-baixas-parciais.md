# CRM-F3-06 — Transferências entre contas e baixas parciais

Status: Done (implementado 2026-08-05)

## Objetivo

Permitir baixar uma parcela (recebível ou pagável) parcialmente, em mais de uma vez, e transferir dinheiro entre contas financeiras próprias.

## Escopo

- Baixa parcial acumulativa: `installments`/`payable_installments` ganham o status `partially_paid` (novo valor no enum `installment_status`, via `ALTER TYPE ... ADD VALUE`, aditivo). `deriveInstallmentStatus` (pure function) decide o status a partir do total pago acumulado - reaproveitada por recebíveis e pagáveis.
- Estorno parcial: `amount` opcional em `reverseInstallmentPayment`/`reversePayableInstallmentPayment` - default reverte o total pago até agora, mas aceita reverter só parte.
- Transferência: `createFinancialTransfer` - duas linhas no razão (saída da origem, entrada no destino) ligadas por `transferGroupId`, sempre na mesma transação (nunca uma perna sem a outra).
- UI: baixa parcial reaproveita o mesmo input de valor já existente (`InstallmentRow`); transferência é um formulário novo em `AccountsPanel`.

## Fora de escopo

- Transferência com taxa/IOF - valor sempre integral entre as duas pernas.
- Agendamento de transferência futura.

## Critérios de aceite verificáveis

- Duas baixas parciais somando o valor total da parcela resultam em status `paid`.
- Uma baixa parcial resulta em status `partially_paid` e mantém o recebível/pagável `open`.
- Transferir para a mesma conta de origem é rejeitado.
- Tipos, testes e build passam.

## Regras de autorização

Transferência usa `financial_accounts.manage` (é uma operação sobre contas). Baixa parcial reaproveita `finance.mark_paid`/`payables.mark_paid` já existentes.

## Alterações de banco

Valor `partially_paid` adicionado ao enum `installment_status` (`ALTER TYPE ... ADD VALUE`, aditivo - não reescreve a tabela), parte de `0011_fase3_financeiro_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/enums.ts` - `partially_paid`.
- `src/server/services/installment-status.ts` - novo.
- `src/server/actions/financial-transfers.ts` + `.schemas.ts` + `.schemas.test.ts` - novos.
- `src/server/actions/finance.ts`, `src/server/actions/payables.ts` - baixa/estorno parcial.
- `src/components/crm/finance/accounts-panel.tsx` - formulário de transferência.

### Completion Notes

`tsc --noEmit`, `vitest run` (154/154), `biome check`, `next build` - todos verdes.
