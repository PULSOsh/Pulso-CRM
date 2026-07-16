# API e Eventos — Contrato Conceitual

## Princípios

- validar entrada com Zod;
- autorizar no servidor;
- resolver organização pela sessão ou token público;
- aplicar idempotência em envios e ações públicas;
- usar transações em operações compostas;
- registrar auditoria em ações críticas;
- não expor entidades do banco diretamente.

## Endpoints públicos sugeridos

```text
GET  /api/public/briefings/{slug}
POST /api/public/briefings/{slug}/drafts
PATCH /api/public/briefing-drafts/{token}
POST /api/public/briefing-drafts/{token}/files
POST /api/public/briefing-drafts/{token}/submit
GET  /api/public/proposals/{token}
POST /api/public/proposals/{token}/view
POST /api/public/proposals/{token}/accept
POST /api/public/proposals/{token}/reject
POST /api/public/proposals/{token}/request-changes
GET  /api/public/proposals/{token}/pdf
```

## Endpoints internos sugeridos

```text
GET/POST /api/briefing-templates
GET/PATCH /api/briefing-templates/{id}
POST /api/briefing-templates/{id}/publish
GET /api/briefing-submissions
GET/PATCH /api/briefing-submissions/{id}
POST /api/briefing-submissions/{id}/link
POST /api/proposals
POST /api/proposals/from-briefing/{submissionId}
POST /api/proposals/from-opportunity/{opportunityId}
PATCH /api/proposals/{id}
POST /api/proposals/{id}/versions
POST /api/proposals/{id}/publish
POST /api/proposals/{id}/send
POST /api/proposals/{id}/revoke
```

## Eventos de domínio

- `briefing.template_published`;
- `briefing.draft_started`;
- `briefing.draft_saved`;
- `briefing.submitted`;
- `briefing.flagged_as_duplicate`;
- `briefing.linked_to_opportunity`;
- `proposal.draft_created`;
- `proposal.version_created`;
- `proposal.published`;
- `proposal.sent`;
- `proposal.viewed`;
- `proposal.changes_requested`;
- `proposal.rejected`;
- `proposal.accepted`;
- `proposal.expired`.

## Outbox

Eventos que acionam e-mail, webhook, job ou integração devem ser gravados na mesma transação da alteração principal. Um worker processa a outbox com tentativas, backoff e idempotência.
