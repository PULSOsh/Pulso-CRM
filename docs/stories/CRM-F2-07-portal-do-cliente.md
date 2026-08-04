# CRM-F2-07 — Portal do cliente

Status: Done (implementado 2026-08-04) — MVP focado em status de entrega

## Objetivo

Dar ao cliente uma página própria para acompanhar o andamento do projeto, sem exigir conta/login — mesmo padrão de token público já usado em proposta/contrato/aprovação.

## Escopo

- `projects.clientPortalToken` (uuid revogável, já gerado por padrão) + `clientPortalEnabled` (boolean, desligado até a equipe ativar explicitamente).
- `enableClientPortal`/`disableClientPortal` (internas).
- `getClientPortalProject(token)` (pública): retorna nome, descrição, status, prazo, marcos (título/prazo/concluído, sem notas internas), aprovações (título/status), arquivos marcados públicos. **Nunca expõe valor financeiro, custo/margem ou notas internas de encerramento.**
- `/portal/[token]`: página pública, mesmo padrão visual das outras páginas públicas (`.public-proposal`).
- UI interna: `ClientPortalPanel` — ativar/desativar, copiar link (mesmo padrão manual de "copiar link/WhatsApp" já estabelecido, sem envio automático de e-mail).

## Fora de escopo

- Múltiplos usuários de cliente com contas próprias (`client_portal_users` do plano mestre) — token único por projeto é suficiente pro caso de uso atual e evita gerenciar autenticação de terceiros.
- Mensagens/chat dentro do portal.
- Cobranças/financeiro visível ao cliente (fora por decisão de privacidade, não por falta de dado).

## Critérios de aceite verificáveis

- Ativar o portal gera/expõe um link com o token já existente no projeto (não recria um novo a cada ativação, preservando qualquer link já compartilhado antes de uma desativação temporária).
- O link só funciona enquanto `clientPortalEnabled = true`.
- A página pública nunca mostra valor financeiro do projeto.
- Tipos, testes e build passam.

## Regras de autorização

`projects.update` para ativar/desativar. A página pública não usa `requirePermission` (gateada só pelo token + `clientPortalEnabled`, mesmo padrão de proposta/contrato/aprovação).

## Alterações de banco

`clientPortalToken`/`clientPortalEnabled` em `projects`, parte de `0010_lonely_cardiac.sql`, não aplicada.

## Riscos

- Token único por projeto (não por visita) — se compartilhado incorretamente, dá acesso de leitura ao status do projeto pra quem tiver o link. Mesmo modelo de risco já aceito para proposta/contrato/aprovação neste projeto; desativar o portal revoga o acesso imediatamente.

## Dev Agent Record

### File List

- `src/server/db/schema/projects.ts` — `clientPortalToken`/`clientPortalEnabled`.
- `src/server/actions/client-portal.ts` + `.schemas.ts` + `.schemas.test.ts` — novos (`enableClientPortal`/`disableClientPortal`/`getClientPortalProject`).
- `src/server/actions/files.ts` — `getPublicFilesForEntity` aceita `entityType: "project"`.
- `src/app/portal/[token]/page.tsx` — novo.
- `src/components/crm/client-portal-panel.tsx` — novo.
- `src/components/crm/project-details-client.tsx` — integra o painel.

### Completion Notes

`tsc --noEmit`, `vitest run` (127/127), `biome lint`, `next build` (33 rotas, `/portal/[token]` confirmada) — todos verdes. Tentativa de abrir `/portal/[token]` com token inválido no navegador local retornou 500 por `ECONNREFUSED` (sem banco disponível neste ambiente) em vez do 404 esperado — mesma limitação de toda a sessão, não um bug da rota (confirmado pelo log estruturado, `F0-09`, mostrando a query real falhando por falta de conexão, não um erro de código).