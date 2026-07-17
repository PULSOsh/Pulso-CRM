# ADR 0001 — PULSO CRM será interno e exclusivo

- Status: aceito
- Data: 17/07/2026

## Contexto

Documentos anteriores consideravam a possibilidade de transformar o PULSO CRM em SaaS, white label ou produto para outras empresas.

Essa possibilidade aumentava o escopo com multiempresa comercial, onboarding, planos, billing, limites, marca por tenant e administração de plataforma.

## Decisão

O PULSO CRM será desenvolvido somente para uso interno da PULSO.

Não será comercializado como SaaS e não será preparado como white label.

## Consequências positivas

- escopo menor;
- implementação mais direta;
- regras adaptadas à operação real;
- menos abstrações prematuras;
- menor custo de manutenção;
- prioridade em uso diário;
- maior velocidade para entregar fluxo completo.

## Consequências e limites

- não haverá onboarding público;
- não haverá billing do CRM;
- não haverá planos;
- não haverá tenant switching;
- não haverá superadmin de plataforma;
- não haverá customização por cliente externo;
- decisões podem ser específicas da PULSO.

## Regra de revisão

Esta decisão só deve ser revisada por decisão explícita de Gustavo, registrada em novo ADR. Não antecipar essa revisão no código.
