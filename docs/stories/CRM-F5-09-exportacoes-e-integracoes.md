# CRM-F5-09 — Exportações e integrações

Status: Done (implementado 2026-08-05)

## Objetivo

Permitir baixar os relatórios fixos em CSV e dar o primeiro uso real a `integration_connections`.

## Achado

`integration_connections` existia desde a migration `0000` (produção), sem nenhuma action - schema pronto, zero uso, mesma situação de `financial_accounts` na Fase 3. Exportação (CSV/PDF) não existia de nenhuma forma; só havia parser de importação CSV.

## Escopo

- `toCsv` (novo, `services/csv.ts`) - gerador RFC 4180, inverso de `parseCsv`/`csvToObjects` já existentes.
- `exportCommercialReportCsv`/`exportFinancialReportCsv` (`reports.ts`): geram a string no servidor, download é feito no cliente via `Blob` - nenhum arquivo é armazenado.
- `integration_connections`: CRUD restrito a `provider="webhook"` (único tipo que o motor de automações sabe consumir, F5-04). `credentialsEncrypted` fica sempre nulo - uma URL de webhook não é segredo do sistema; um provedor futuro que exija OAuth precisará de uma decisão própria de criptografia em repouso, não fabricada aqui.

## Fora de escopo

- Exportação em PDF - exigiria uma dependência nova (`pdf-lib`/`puppeteer`/similar), decisão de instalação deliberadamente não tomada nesta story (CLAUDE.md §7: "não instalar pacote sem verificar compatibilidade").
- Outros provedores de integração (Slack/Zapier/etc. como conectores nomeados) - hoje é só "webhook genérico", qualquer serviço que aceite POST JSON funciona.

## Critérios de aceite verificáveis

- O CSV exportado é o inverso exato do que `csvToObjects` leria de volta.
- Criar uma integração com URL inválida é rejeitado antes de gravar.
- Tipos, testes (CSV) e build passam.

## Regras de autorização

Exportação reaproveita a permissão do relatório de origem. `integrations.manage` já existia (declarada, nunca usada até agora).

## Alterações de banco

Nenhuma - `integration_connections` já existia desde `0000`.

## Dev Agent Record

### File List

- `src/server/services/csv.ts` + `.test.ts` — `toCsv`.
- `src/server/actions/reports.ts` — `exportCommercialReportCsv`/`exportFinancialReportCsv`.
- `src/server/actions/integrations.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/reports/export-csv-button.tsx`, `src/components/crm/automation/automation-client.tsx` (seção de integrações) — novos.

### Completion Notes

`tsc --noEmit`, `vitest run` (205/205), `biome check`, `next build` — todos verdes.

## Fechamento da Fase 5

Com esta story, as 9 stories da Fase 5 (F5-01 a F5-09) estão implementadas. O gate da fase - "automações são idempotentes, observáveis e reversíveis; IA nunca executa ação crítica sem confirmação" - está satisfeito no código: idempotência via constraint unique em `automation_runs`, observabilidade via fila com contadores pendente/dead-letter e histórico de execuções, reversibilidade por desenho (só 3 tipos de ação, todos seguros), e IA sempre pendente de confirmação humana antes de qualquer efeito real. Falta validação com dado real (banco disponível, `ANTHROPIC_API_KEY` real, evento de automação disparado de ponta a ponta) - débito recorrente de toda a sessão.
