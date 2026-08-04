# CRM-F2-04 — Apontamento de horas

Status: Done (implementado 2026-08-04)

## Objetivo

Registrar horas trabalhadas por projeto, por pessoa, com total visível.

## Escopo

- `time_entries` (novo): data, horas, descrição, autor.
- `getTimeEntriesForProject`/`logTime`/`deleteTimeEntry`.
- `deleteTimeEntry` só permite ao próprio autor excluir (nenhum papel hoje distingue "editar horas de terceiros" — o padrão seguro é restringir ao autor).
- UI: `TimeTrackingPanel` na tela de detalhe, total somado exibido.

## Fora de escopo

- Edição de apontamento existente (só criar/excluir).
- Aprovação de horas por um gestor.
- Relatório agregado de horas por pessoa/período (dado existe, relatório é trabalho futuro).

## Critérios de aceite verificáveis

- Lançar horas cria o registro e atualiza o total exibido.
- Excluir um apontamento de outro usuário é bloqueado.
- Horas ≤ 0 ou > 24 num único lançamento são rejeitadas.
- Tipos, testes e build passam.

## Regras de autorização

`projects.read`/`projects.update` (mesmas chaves já usadas no resto do projeto).

## Alterações de banco

Tabela nova, parte de `0010_lonely_cardiac.sql`, não aplicada.

## Dev Agent Record

### File List

- `src/server/db/schema/projects.ts` — `timeEntries`.
- `src/server/actions/time-entries.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/time-tracking-panel.tsx` — novo.
- `src/components/crm/project-details-client.tsx` — integra o painel.

### Completion Notes

`tsc --noEmit`, `vitest run` (127/127), `biome lint`, `next build` (33 rotas) — todos verdes no lote da Fase 2. Verificação com dado real não realizada.