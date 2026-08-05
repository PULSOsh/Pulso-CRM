# CRM-F4-09 — Calendário e alertas pessoais

Status: Done (implementado 2026-08-05) - relatório de próximos itens, sem notificação proativa

## Objetivo

Dar visibilidade do que está por vir (lançamento futuro já parcelado, recorrência prevista, fatura de cartão) nos próximos 60 dias.

## Achado / decisão

O calendário compartilhado de tarefas/marcos (F2-03) é visível a papéis de negócio (`projects`, `commercial` via marcos de projeto). Dado pessoal **nunca** pode aparecer ali, mesmo indiretamente — por isso este é um relatório próprio (`getPersonalUpcomingItems`), renderizado só dentro de `/crm/pessoal`, nunca integrado ao componente `CalendarClient` existente.

## Escopo

- `getPersonalUpcomingItems(daysAhead)`: mescla lançamentos futuros já existentes (parcelas), próximas ocorrências de recorrência (`nextRunDate`) e datas de vencimento de fatura de cartão, ordenado por data.

## Fora de escopo

- Notificação proativa (e-mail/push) - é um relatório sob consulta, não um alerta enviado.
- Integração com calendário externo (Google Calendar etc.).

## Critérios de aceite verificáveis

- Uma recorrência desativada não aparece nos próximos itens.
- Uma fatura já paga do mês atual não aparece marcada como pendente.
- Tipos e build passam.

## Regras de autorização

`requirePersonalAccess("read")`.

## Alterações de banco

Nenhuma - relatório de leitura sobre tabelas já criadas em F4-02 a F4-05.

## Dev Agent Record

### File List

- `src/server/actions/personal-reports.ts` — `getPersonalUpcomingItems`.
- `src/components/crm/personal/personal-reports-panel.tsx` — seção "Próximos 60 dias".

### Completion Notes

`tsc --noEmit`, `next build` — verdes.
