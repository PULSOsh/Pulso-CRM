# ADR 0002 — Manter `organization_id` como fronteira técnica interna

- Status: aceito
- Data: 17/07/2026

## Contexto

O banco e o código existentes já utilizam organização e `organization_id`. O produto agora será single-workspace e não SaaS.

Remover imediatamente a estrutura poderia gerar:

- migration destrutiva;
- risco de perda;
- grande refatoração;
- regressões em autorização;
- atraso sem ganho operacional.

## Decisão

Manter a organização PULSO e os campos existentes como fronteira técnica interna.

Não construir recursos de multiempresa ao redor dessa estrutura.

## Regras

- exatamente um workspace operacional;
- sem seletor de organização;
- sem criação de organização pela interface;
- sem planos ou billing;
- sem marca por organização;
- contexto resolvido no servidor;
- `organization_id` enviado pelo cliente não concede acesso;
- filtros continuam obrigatórios onde a estrutura atual exige;
- eventual simplificação futura só com migration planejada e benefício comprovado.

## Consequência

A base permanece segura e compatível sem transformar o CRM em produto multi-tenant.
