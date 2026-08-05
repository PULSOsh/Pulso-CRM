# CRM-F5-07 — Dashboards configuráveis

Status: Done (implementado 2026-08-05)

## Objetivo

Deixar cada usuário mostrar/ocultar as seções do relatório que fazem sentido pra ele, sem construir um BI genérico.

## Achado

`reports.ts` já tinha 6 relatórios fixos (Fase 0/3); `/crm/relatorios` só usava 3 (comercial/operacional/financeiro) - "configurável" foi desenhado sobre o que já existe de verdade na página, não sobre todas as funções do arquivo.

## Escopo

- `dashboard_widget_preferences` (novo, por usuário): mostrar/ocultar e posição, catálogo fixo de 3 chaves (`commercial_section`/`operational_section`/`financial_section` - granularidade de seção, não de sub-métrica, nesta primeira versão).
- `getDashboardPreferences` (mescla catálogo + preferência salva, default tudo visível), `setDashboardWidgetVisibility`, `reorderDashboardWidgets`.
- UI: painel de checkboxes no topo de `/crm/relatorios`.

## Fora de escopo

- Reordenar por arrastar (a action `reorderDashboardWidgets` existe, mas a UI desta fase só expõe mostrar/ocultar).
- Widgets por sub-métrica (ex.: só "leads por mês" sem o resto do comercial) - group by seção inteira é suficiente pro volume de uso atual.

## Critérios de aceite verificáveis

- Ocultar uma seção persiste entre sessões (por usuário, não global).
- Um usuário sem preferência salva vê tudo visível por padrão.
- Tipos e build passam.

## Regras de autorização

Reaproveita `reports.read` - sem chave nova.

## Alterações de banco

Tabela `dashboard_widget_preferences` (nova), parte de `0013_fase5_atendimento_automacao_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/dashboard.ts`.
- `src/server/services/dashboard-widgets.ts` — catálogo.
- `src/server/actions/dashboard-preferences.ts` — novo.
- `src/components/crm/reports/dashboard-preferences-panel.tsx`, `src/app/crm/relatorios/page.tsx` — integração.

### Completion Notes

`tsc --noEmit`, `next build` — verdes.
