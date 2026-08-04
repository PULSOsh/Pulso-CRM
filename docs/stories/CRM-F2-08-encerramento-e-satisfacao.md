# CRM-F2-08 — Encerramento e satisfação

Status: Done (implementado 2026-08-04) — fecha a Fase 2

## Objetivo

Fechar formalmente um projeto e coletar a avaliação do cliente, reaproveitando o token do portal do cliente (F2-07) em vez de criar um segundo mecanismo de compartilhamento.

## Escopo

- `projects.closedNotes`/`satisfactionScore`/`satisfactionComment`/`satisfactionRequestedAt`/`satisfactionRespondedAt` (novos). `completedAt` (já existia desde a fundação, nunca era escrito) passa a marcar o encerramento de verdade.
- `closeProject(projectId, notes)`: marca `status = "completed"`, `completedAt`, `closedNotes`, e já seta `satisfactionRequestedAt` (a avaliação fica disponível no portal a partir daí).
- `submitSatisfaction(token, score, comment)` (pública, mesmo token do portal): só aceita se a avaliação foi solicitada e ainda não respondida; grava nota (1-5) + comentário, audita, notifica o responsável do projeto.
- UI interna: botão "Encerrar projeto" com nota opcional (`ClientPortalPanel`). UI pública: formulário de estrelas no `/portal/[token]` quando há avaliação pendente.

## Fora de escopo

- Envio automático de e-mail solicitando a avaliação — mesmo padrão manual já estabelecido (compartilhar o link do portal).
- Relatório agregado de satisfação por período/cliente (dado existe, relatório é trabalho futuro).

## Critérios de aceite verificáveis

- Encerrar um projeto muda o status, grava `completedAt`/`closedNotes`, e habilita a avaliação no portal.
- Enviar a avaliação sem ela ter sido solicitada é rejeitado.
- Enviar a avaliação duas vezes é rejeitado na segunda tentativa.
- Nota fora do intervalo 1-5 é rejeitada.
- Tipos, testes e build passam.

## Regras de autorização

`projects.complete` para encerrar. `submitSatisfaction` não usa `requirePermission` (pública, gateada pelo token + estado de solicitação/resposta).

## Alterações de banco

5 colunas novas em `projects`, parte de `0010_lonely_cardiac.sql`, não aplicada.

## Dev Agent Record

### File List

- `src/server/db/schema/projects.ts` — colunas de encerramento/satisfação.
- `src/server/actions/client-portal.ts` — `closeProject`/`submitSatisfaction`.
- `src/app/portal/[token]/satisfaction-form.tsx` — novo.
- `src/app/portal/[token]/page.tsx` — seção de avaliação condicional.
- `src/components/crm/client-portal-panel.tsx` — botão de encerramento.

### Completion Notes

`tsc --noEmit`, `vitest run` (127/127), `biome lint`, `next build` (33 rotas) — todos verdes. Verificação com dado real não realizada (mesma limitação de toda a sessão).

## Fechamento da Fase 2

Com esta story, as 8 stories da Fase 2 (F2-01 a F2-08) estão implementadas. O gate da fase — "projeto completo executado com escopo, prazo, custo, aprovações e aceite final rastreáveis" — está tecnicamente satisfeito no código: templates de projeto, marcos com dependência, responsáveis, calendário compartilhado, apontamento de horas, arquivos versionados, alteração de escopo com impacto real em valor/prazo, portal do cliente e encerramento com satisfação. Falta validação com dado real (organização/usuário de teste, banco disponível), débito recorrente de toda a sessão.