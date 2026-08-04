# CRM-F2-06 — Aprovações e alteração de escopo

Status: Done (implementado 2026-08-04)

## Objetivo

Registrar pedidos de mudança de escopo com impacto em valor/prazo, decididos internamente, com o valor/prazo do projeto ajustado de verdade quando aprovado.

## Achado

Aprovações genéricas (`approvals`) já existiam desde a Fase 3 de uma sessão anterior — essa parte da story já estava concluída. O que faltava era "alteração de escopo": `approvals` não tem campos estruturados de impacto (valor/prazo), então criar uma entidade dedicada fez mais sentido do que forçar esses campos numa tabela genérica.

## Escopo

- `project_scope_changes` (novo): título, descrição, `valueDelta`, `deadlineDeltaDays`, status, decisão.
- `requestScopeChange`/`decideScopeChange`.
- `decideScopeChange` aprovado: dentro de uma transação, soma `valueDelta` a `projects.totalValue` e desloca `projects.dueDate` por `deadlineDeltaDays` (se houver prazo definido), grava `activities`/`audit_logs` — "alteração de preço registra evento" (`docs/PRODUCT_VISION.md`).
- UI: `ScopeChangesPanel` na tela de detalhe.

## Fora de escopo

- Decisão pelo cliente via portal (fica interna, staff decide) — o portal do cliente (F2-07) só mostra status de entrega, não decide alterações de escopo.
- Gerar uma nova proposta/aditivo de contrato a partir da alteração aprovada.

## Critérios de aceite verificáveis

- Solicitar uma alteração de escopo cria o registro com status `pending`.
- Aprovar soma o `valueDelta` ao `totalValue` do projeto e desloca o prazo, se houver `deadlineDeltaDays` e `dueDate` definidos.
- Rejeitar só muda o status, sem tocar no projeto.
- Decidir uma alteração já decidida é bloqueado.
- Tipos, testes e build passam.

## Regras de autorização

`projects.update` (solicitar e decidir — decisão interna, sem chave nova).

## Alterações de banco

Tabela nova, parte de `0010_lonely_cardiac.sql`, não aplicada.

## Dev Agent Record

### File List

- `src/server/db/schema/projects.ts` — `projectScopeChanges`.
- `src/server/actions/scope-changes.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/scope-changes-panel.tsx` — novo.
- `src/components/crm/project-details-client.tsx` — integra o painel.

### Completion Notes

`tsc --noEmit`, `vitest run` (127/127), `biome lint`, `next build` (33 rotas) — todos verdes no lote da Fase 2. Verificação com dado real não realizada.