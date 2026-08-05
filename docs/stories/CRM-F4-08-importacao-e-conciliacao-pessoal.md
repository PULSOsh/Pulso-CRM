# CRM-F4-08 — Importação e conciliação pessoal

Status: Done (implementado 2026-08-05)

## Objetivo

Trazer o extrato bancário pessoal (CSV/OFX) e casar cada linha com o lançamento correspondente já registrado.

## Escopo

- `personal_bank_imports`/`personal_bank_import_lines` (novos) - mesmo parser genérico da Fase 3 (`services/bank-import.ts`, sem alteração), tabelas próprias para não misturar extrato pessoal com o razão empresarial.
- `getPersonalReconciliationCandidates`/`matchPersonalBankImportLine`/`unmatchPersonalBankImportLine`/`ignorePersonalBankImportLine` — mesmo padrão de sugestão manual da Fase 3 (F3-09), nunca casamento automático.

## Fora de escopo

- Dedupe automático de reimportação por `externalId` — mesmo débito já registrado na Fase 3 (F3-08).

## Critérios de aceite verificáveis

- Sugestões de conciliação nunca incluem um lançamento já casado com outra linha.
- Desfazer um casamento devolve a linha para `unmatched`.
- Tipos, testes (parser reaproveitado, já cobertos na Fase 3) e build passam.

## Regras de autorização

`requirePersonalAccess("read"/"manage")`.

## Alterações de banco

Tabelas `personal_bank_imports`/`personal_bank_import_lines` (novas), parte de `0012_fase4_financas_pessoais_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/personal-finance.ts` — `personalBankImports`, `personalBankImportLines`.
- `src/server/actions/personal-bank-imports.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/personal/personal-bank-import-panel.tsx` — novo.

### Completion Notes

`tsc --noEmit`, `vitest run` (180/180), `biome check`, `next build` — todos verdes.
