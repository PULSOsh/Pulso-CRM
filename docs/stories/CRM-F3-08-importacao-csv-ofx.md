# CRM-F3-08 — Importação de extrato (CSV/OFX)

Status: Done (implementado 2026-08-05)

## Objetivo

Trazer o extrato bancário real (CSV ou OFX) para dentro do sistema como material de conciliação (F3-09), sem exigir integração bancária automática.

## Achado

Já existia um parser CSV mínimo (`services/csv.ts`, RFC 4180) usado em outros módulos - reaproveitado para o layout de extrato em vez de escrito de novo. OFX não tinha nenhum parser.

## Escopo

- `bank_imports` + `bank_import_lines` (novas).
- `parseCsvStatement`/`parseOfxStatement` (`services/bank-import.ts`): CSV aceita colunas em português ou inglês (data/descricao/valor, aceita "1.234,56" pt-BR); OFX extrai `DTPOSTED`/`TRNAMT`/`FITID`/`NAME`/`MEMO` de cada bloco `<STMTTRN>` (parser mínimo, OFX é SGML e não XML estrito).
- `createBankImport`: importação **nunca gera transação no razão por si só** - só cria linhas pendentes de conciliação (F3-09).
- UI (`BankImportPanel`): upload de arquivo lido no navegador (`FileReader`), sem passar por armazenamento externo.

## Fora de escopo

- Conexão bancária automática (Open Finance/API do banco).
- Dedupe automático de reimportação por `externalId` (FITID) - o campo é armazenado, mas a comparação contra importações anteriores é trabalho futuro caso reimportação acidental se torne um problema real.

## Critérios de aceite verificáveis

- CSV sem coluna de data ou valor é rejeitado com mensagem clara.
- OFX sem `DTPOSTED`/`TRNAMT` num bloco `<STMTTRN>` é ignorado (não quebra a importação inteira).
- Tipos, testes (parser) e build passam.

## Regras de autorização

`bank_imports.manage` (nova, cobre importar e conciliar).

## Alterações de banco

Tabelas `bank_imports`/`bank_import_lines` (novas), parte de `0011_fase3_financeiro_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/ledger.ts` - `bankImports`, `bankImportLines`.
- `src/server/services/bank-import.ts` + `.test.ts` - novos.
- `src/server/actions/bank-imports.ts` + `.schemas.ts` + `.schemas.test.ts` - novos.
- `src/components/crm/finance/bank-import-panel.tsx` - novo.

### Completion Notes

`tsc --noEmit`, `vitest run` (154/154, incluindo parser CSV/OFX), `biome check`, `next build` - todos verdes. Testado com CSV pt-BR/inglês e um bloco OFX mínimo sintético - não testado contra um extrato bancário real (sem acesso a um nesta sessão).
