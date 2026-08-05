# CRM-F5-06 — Notificações

Status: Done (implementado 2026-08-05) - in-app já existia, webhook novo via automação

## Objetivo

Confirmar o estado do canal in-app já funcional e adicionar um segundo canal real (webhook de saída), sem inventar envio de e-mail/WhatsApp sem credencial.

## Achado

`notifications`/`notifyUser` já eram funcionais desde uma sessão anterior (CRUD completo, usados em vários pontos do sistema) - decisão documentada no próprio código de "começar só por in_app, não expandir sem necessidade comprovada" permanece válida: nenhuma integração real de e-mail/SMS foi adicionada (exigiria credencial de provedor que não existe neste ambiente, mesma classe de decisão já tomada para S3).

## Escopo

- Canal `webhook` deixa de ser só um valor de enum sem uso: a ação de automação `send_webhook` (F5-04) faz POST JSON para toda `integration_connections` ativa com `provider="webhook"` da organização.
- Nenhuma mudança em `notifyUser`/`notifications` - continuam in-app apenas.

## Fora de escopo

- E-mail/WhatsApp reais - sem credencial de provedor configurada, implementar isso agora seria construir código morto ou, pior, uma integração não testável.
- Preferências de notificação por usuário/tipo.

## Critérios de aceite verificáveis

- Uma regra de automação com ação `send_webhook` sem nenhuma integração ativa falha com erro claro (registrado em `automation_runs`, não falha silenciosamente).
- Tipos e build passam.

## Regras de autorização

Reaproveita `automation.manage`/`integrations.manage` - sem chave nova específica de notificação.

## Alterações de banco

Nenhuma.

## Dev Agent Record

### File List

- `src/server/actions/automation-engine.ts` — ação `send_webhook`.

### Completion Notes

`tsc --noEmit`, `next build` — verdes.
