# CRM-F2-02 — Marcos e dependências

Status: Done (implementado 2026-08-04)

## Objetivo

Dar ao projeto marcos com data e uma dependência simples entre eles (um marco não pode ser concluído enquanto o marco do qual depende não estiver concluído).

## Escopo

- `milestones` (novo): título, prazo, responsável, `dependsOnMilestoneId` (auto-FK nullable).
- `getMilestonesForProject`/`createMilestone`/`toggleMilestone`/`deleteMilestone`.
- `toggleMilestone` bloqueia conclusão se a dependência ainda não estiver concluída.
- `deleteMilestone` bloqueia exclusão se outro marco depende dele (evita deixar uma regra de dependência apontando pro vazio silenciosamente).
- UI: `MilestonesPanel` na tela de detalhe do projeto.

## Fora de escopo

- Dependências múltiplas por marco (só uma, `dependsOnMilestoneId` único) — suficiente pro caso de uso linear típico; grafo de dependências é upgrade futuro.
- Reordenar marcos por arrastar (só ordem de criação/posição).

## Critérios de aceite verificáveis

- Criar um marco que depende de outro e tentar concluí-lo antes do outro é bloqueado com mensagem clara.
- Concluir a dependência primeiro permite concluir o marco dependente.
- Excluir um marco do qual outro depende é bloqueado.
- `dependsOnMilestoneId` de outro projeto é rejeitado.
- Tipos, testes e build passam.

## Regras de autorização

`projects.read` para listar, `projects.update` para criar/concluir/excluir.

## Alterações de banco

Tabela nova (`0010_lonely_cardiac.sql`, compartilhada com F2-01/F2-03 a F2-06), não aplicada.

## Dev Agent Record

### File List

- `src/server/db/schema/projects.ts` — `milestones`.
- `src/server/actions/milestones.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/milestones-panel.tsx` — novo.
- `src/components/crm/project-details-client.tsx` — integra o painel.

### Completion Notes

`tsc --noEmit`, `vitest run` (127/127), `biome lint`, `next build` (33 rotas) — todos verdes no lote da Fase 2. Verificação com dado real não realizada (mesma limitação de toda a sessão).