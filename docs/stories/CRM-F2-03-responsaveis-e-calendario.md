# CRM-F2-03 — Responsáveis e calendário

Status: Done (implementado 2026-08-04)

## Objetivo

Permitir atribuir um responsável a itens de checklist e marcos, e mostrar os prazos do projeto (marcos) no calendário que já existia pra tarefas.

## Achado

`getOrganizationMembers` não existia — a permissão `members.read` estava no catálogo desde a Fase 1, sem nenhum código usando. Primeiro uso real nesta story.

## Escopo

- `project_checklist_items.assignedTo` (novo, FK `users.id`).
- `assignChecklistItem(itemId, projectId, userId)`.
- `milestones.assignedTo` (já incluído no schema de F2-02).
- `src/server/actions/members.ts::getOrganizationMembers()` — primeiro uso real de `members.read`; adicionada a `commercial`/`projects` (roles que precisam saber quem são os colegas pra atribuir trabalho).
- `getMilestonesForMonth`: marcos de todos os projetos com prazo no intervalo, pra aparecer no mesmo calendário de `/crm/tarefas/calendario`.
- `CalendarClient` generalizado: prop `tasks` renomeada para aceitar itens de dois tipos (`task`/`milestone`), marcos aparecem com 🚩 e linkam pro projeto.

## Fora de escopo

- Página de calendário dedicada só a projetos — reaproveitar a existente foi a decisão de escopo (ver mais em cada dia, não duplicar UI).
- Notificação ao responsável quando atribuído (fica pra quando houver necessidade comprovada, mesmo critério já usado pra e-mail/WhatsApp em outras stories).

## Critérios de aceite verificáveis

- Atribuir um responsável a um item de checklist persiste e aparece no select.
- Marcos com prazo no mês aparecem em `/crm/tarefas/calendario` junto com as tarefas, com link pro projeto.
- `commercial`/`projects` conseguem listar membros sem erro de permissão.
- Tipos, testes e build passam.

## Regras de autorização

`members.read` (agora também em `commercial`/`projects`, além de `owner`/`admin`/`viewer` que já tinham por herança). `projects.update` para atribuir.

## Alterações de banco

`project_checklist_items.assigned_to` (nova coluna), parte de `0010_lonely_cardiac.sql`, não aplicada.

## Dev Agent Record

### File List

- `src/server/db/schema/projects.ts` — `projectChecklistItems.assignedTo`.
- `src/server/actions/members.ts` — novo.
- `src/server/auth/permission-keys.ts` — `members.read` em `commercial`/`projects`.
- `src/server/actions/projects.ts` — `assignChecklistItem`.
- `src/server/actions/milestones.ts` — `getMilestonesForMonth`.
- `src/components/crm/tasks/calendar-client.tsx` — generalizado pra tasks+milestones.
- `src/app/crm/tarefas/calendario/page.tsx` — busca e mescla marcos.
- `src/components/crm/project-details-client.tsx` — select de responsável no checklist.

### Completion Notes

`tsc --noEmit`, `vitest run` (127/127), `biome lint`, `next build` (33 rotas), `playwright test` (6/6) — todos verdes no lote da Fase 2. Verificação com dado real não realizada.