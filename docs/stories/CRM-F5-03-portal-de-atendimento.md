# CRM-F5-03 — Portal de atendimento

Status: Done (implementado 2026-08-05)

## Objetivo

Dar ao cliente um jeito de abrir e acompanhar chamados sem precisar de conta, e uma central de ajuda pública para dúvidas comuns.

## Achado

O plano mestre já previa "chamados" como parte do mesmo portal do cliente (Módulo L, junto de propostas/contratos/projetos) - em vez de um segundo portal com token próprio, F5-03 estende `/portal/[token]` (F2-07) com uma seção de chamados, reaproveitando o token e a validação já existentes (`clientPortalEnabled`).

## Escopo

- `getClientPortalTickets(token)`: lista os tickets do projeto (só assunto/status/prioridade/data, sem comentários internos nem quem atende).
- `createPortalTicket(token, {subject, description})`: público, cria ticket vinculado ao projeto/empresa do portal, `createdBy` nulo (identifica "aberto pelo cliente"), notifica o dono do projeto.
- `/ajuda` + `/ajuda/[slug]` (novo, público, sem token): central de ajuda institucional com os artigos publicados da base de conhecimento (F5-02), agrupados por categoria.

## Fora de escopo

- Resposta do cliente a um comentário específico via portal (só abrir chamado nesta fase; acompanhar status via lista).
- Autenticação de cliente com conta própria - mesmo modelo de token único já aceito para proposta/contrato/aprovação/projeto.

## Critérios de aceite verificáveis

- Abrir um chamado com um token de portal desativado é rejeitado.
- Chamado aberto pelo portal aparece na lista interna (`/crm/atendimento`) com `createdBy` nulo.
- `/ajuda` nunca mostra artigo em rascunho.
- Tipos e build passam.

## Regras de autorização

Público - gateado só pelo token do projeto (chamados) ou sem gate nenhum (central de ajuda, conteúdo institucional).

## Alterações de banco

Nenhuma além de `support_tickets`/`knowledge_articles` já cobertos em F5-01/F5-02.

## Riscos

`/ajuda` e `/ajuda/[slug]` precisam de `export const dynamic = "force-dynamic"` explícito - sem `params`/`searchParams`, o Next tentaria pré-renderizar estaticamente em build time e bateria no banco (erro real encontrado e corrigido durante a verificação desta story, antes de gerar o build final).

## Dev Agent Record

### File List

- `src/server/actions/tickets.ts` — `getClientPortalTickets`/`createPortalTicket`.
- `src/app/portal/[token]/ticket-form.tsx`, `src/app/portal/[token]/page.tsx` — seção de chamados.
- `src/app/ajuda/page.tsx`, `src/app/ajuda/[slug]/page.tsx` — novos.

### Completion Notes

`tsc --noEmit`, `vitest run` (205/205), `biome check`, `next build` (39 rotas, incluindo `/ajuda` e `/ajuda/[slug]`) — todos verdes.
