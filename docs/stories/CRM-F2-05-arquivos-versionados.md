# CRM-F2-05 — Arquivos versionados

Status: Done (implementado 2026-08-04)

## Objetivo

Permitir enviar uma nova versão de um anexo já existente sem perder a versão anterior, com histórico consultável.

## Escopo

- `attachments` ganha `versionNumber`/`rootAttachmentId` (auto-FK)/`isCurrent`.
- `uploadFile` aceita `supersedesAttachmentId` opcional: valida posse do anexo anterior (mesma org/entidade), calcula `versionNumber`/`rootAttachmentId`, marca o anterior `isCurrent = false` e insere a nova versão `isCurrent = true` — histórico nunca é sobrescrito ("histórico confiável").
- `getFilesForEntity`/`getPublicFilesForEntity` filtram só `isCurrent = true` por padrão.
- `getFileVersionHistory(attachmentId)`: lista todas as versões de uma cadeia.
- UI (`FilesPanel`): botão "Enviar nova versão" por arquivo, badge `vN` quando > 1, "Ver histórico" expansível com download de qualquer versão anterior.

## Fora de escopo

- Diff de conteúdo entre versões (só metadados: nome, data, quem enviou).
- Reverter para uma versão anterior (marcar como atual de novo) — fica pra quando houver necessidade real.

## Critérios de aceite verificáveis

- Enviar uma nova versão de um arquivo existente cria uma linha nova, marca a anterior como não-atual, e a listagem padrão mostra só a versão atual.
- Histórico de versões lista todas em ordem, com indicação de qual é a atual.
- `supersedesAttachmentId` de outra organização/entidade é rejeitado.
- Tipos, testes e build passam.

## Regras de autorização

`files.upload`/`files.read` (mesmas chaves já existentes).

## Alterações de banco

3 colunas novas em `attachments`, parte de `0010_lonely_cardiac.sql`, não aplicada.

## Dev Agent Record

### File List

- `src/server/db/schema/files.ts` — `versionNumber`/`rootAttachmentId`/`isCurrent`.
- `src/server/actions/files.ts` — `uploadFile` com versionamento, `getFileVersionHistory`, `getPublicFilesForEntity` filtra `isCurrent`.
- `src/components/crm/files-panel.tsx` — UI de nova versão/histórico.

### Completion Notes

`tsc --noEmit`, `vitest run` (127/127), `biome lint`, `next build` (33 rotas) — todos verdes no lote da Fase 2. Verificação com dado real (upload real via S3) não realizada — mesma limitação de credenciais já registrada desde a Fase 1 (sem `S3_*` configurado neste ambiente).