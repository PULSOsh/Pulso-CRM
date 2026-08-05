# CRM-F5-01 — Tickets e SLA

Status: Done (implementado 2026-08-05)

## Objetivo

Registrar chamados de atendimento com prioridade, responsável e um compromisso de prazo (SLA) simples.

## Escopo

- `support_tickets` + `ticket_comments` (novos). SLA por prioridade (`services/sla.ts`, pure function): urgente 4h, alta 24h, normal 72h, baixa 7 dias - calculado uma vez na criação (`slaDueAt`), nunca recalculado se a prioridade mudar depois (o compromisso original fica registrado).
- `createTicket`/`getTickets`/`getTicket`/`updateTicketStatus`/`assignTicket`/`addTicketComment`/`getOverdueTickets`.
- Comentário pode ser nota interna (`isInternal`) ou visível ao cliente.
- Cada ticket criado enfileira um evento `ticket_created` no razão de automação (F5-04).

## Fora de escopo

- SLA por categoria/cliente (só por prioridade, 4 níveis fixos).
- Escalonamento automático quando o SLA vence - hoje só aparece como "vencido" em `getOverdueTickets` (verificação sob demanda, mesmo padrão de `refreshOverdueInstallments`).

## Critérios de aceite verificáveis

- Criar um ticket urgente define `slaDueAt` 4 horas à frente.
- `getOverdueTickets` só retorna tickets com status aberto/em atendimento/aguardando cliente vencidos.
- Tipos, testes e build passam.

## Regras de autorização

`tickets.read`/`tickets.manage`/`tickets.comment` (novas, papel `projects` + `admin`/`owner`).

## Alterações de banco

Tabelas `support_tickets`/`ticket_comments` (novas) + enum `ticket_status`, parte de `0013_fase5_atendimento_automacao_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/support.ts`, `src/server/db/schema/enums.ts`.
- `src/server/services/sla.ts` + `.test.ts` — novos.
- `src/server/actions/tickets.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/tickets/tickets-client.tsx`, `src/app/crm/atendimento/page.tsx` — novos.

### Completion Notes

`tsc --noEmit`, `vitest run` (205/205), `biome check`, `next build` (39 rotas), `playwright test` (6/6) — todos verdes.
