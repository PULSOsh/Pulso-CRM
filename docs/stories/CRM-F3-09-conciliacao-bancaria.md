# CRM-F3-09 — Conciliação bancária

Status: Done (implementado 2026-08-05)

## Objetivo

Casar cada linha do extrato importado (F3-08) com o lançamento correspondente no razão (`financial_transactions`), confirmando que o sistema reflete o banco de verdade.

## Escopo

- `getReconciliationCandidates(lineId)`: sugestões por valor exato (em módulo) e data (±5 dias), entre transações ainda não conciliadas - a decisão final é sempre manual, o usuário escolhe entre as sugestões (nunca casamento automático silencioso).
- `matchBankImportLine`/`unmatchBankImportLine`/`ignoreBankImportLine`: marca a linha e a transação (`reconciledAt`), mantém o contador `matchedLines` da importação consistente em ambas as direções (casar/desfazer).
- UI (`BankImportPanel` → `ImportLines`/`LineRow`): expandir uma importação, ver sugestões por linha, casar ou ignorar.

## Fora de escopo

- Casamento automático (mesmo quando há só uma sugestão exata) - decisão deliberada de manter humano no laço para dinheiro.
- Casamento muitos-para-um (uma linha do extrato cobrindo várias transações, ou vice-versa) - só 1:1 nesta fase.

## Critérios de aceite verificáveis

- Casar uma linha marca a transação como conciliada (`reconciledAt` preenchido).
- Desfazer o casamento limpa `reconciledAt` da transação e devolve a linha para `unmatched`.
- Sugestões nunca incluem transações já conciliadas.
- Tipos, testes e build passam.

## Regras de autorização

Reaproveita `bank_imports.manage` (F3-08) - importar e conciliar são a mesma responsabilidade operacional.

## Alterações de banco

Nenhuma além de `bank_import_lines`/`financial_transactions.reconciled_at` já cobertos em `0011_fase3_financeiro_base.sql`.

## Dev Agent Record

### File List

- `src/server/actions/bank-imports.ts` - `getReconciliationCandidates`/`matchBankImportLine`/`unmatchBankImportLine`/`ignoreBankImportLine`.
- `src/components/crm/finance/bank-import-panel.tsx` - UI de conciliação.

### Completion Notes

`tsc --noEmit`, `vitest run` (154/154), `biome check`, `next build` - todos verdes.
