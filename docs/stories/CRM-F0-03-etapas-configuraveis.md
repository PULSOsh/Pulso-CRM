# CRM-F0-03 — Etapas configuráveis do funil

Status: Done (implementado 2026-08-03, aguardando validação com dado real e push do responsável)

## Objetivo

Permitir que um usuário autorizado crie, renomeie, reordene e remova etapas de um funil comercial existente, sem intervenção no banco de dados.

## Usuário e valor

Quem organiza o funil comercial (papel `commercial`/`admin`/`owner`) precisa ajustar as etapas conforme o processo de vendas real muda (ex.: adicionar uma etapa de "Diagnóstico" entre "Qualificação" e "Proposta Enviada"), sem depender de alguém rodar SQL manualmente.

## Contexto atual confirmado

- `pipelineStages` já tem `name`, `color`, `position`, `probability`, `isWon`, `isLost` — schema pronto, só criado hoje (via `DEFAULT_STAGE_TEMPLATE`, `CRM-F0-02`) ou pelo bootstrap idempotente do funil padrão.
- Nenhuma action de gestão de etapa existe hoje — só leitura (`getPipelineWithOpportunities`) e o backfill interno da etapa "Perdido".
- `winOpportunity` já usa a flag `isWon` para achar a etapa de destino (correto, não depende de nome). `loseOpportunity` hoje depende do **nome literal "Perdido"** (`eq(pipelineStages.name, "Perdido")`) em vez da flag `isLost` (que existe no schema mas nunca foi setada) — bug pré-existente que esta story corrige, porque permitir renomear etapas tornaria esse acoplamento por nome uma quebra silenciosa real.

## Escopo

- `createStage(pipelineId, input)`: nova etapa no fim do funil (nome, cor, probabilidade).
- `updateStage(stageId, input)`: renomear, trocar cor, ajustar probabilidade.
- `reorderStage(stageId, direction: "up" | "down")`: troca de posição com o vizinho adjacente.
- `deleteStage(stageId)`: remove etapa sem oportunidades vinculadas; bloqueia com erro claro se houver oportunidade na etapa ou se for a última etapa do funil.
- Corrigir `loseOpportunity` para usar `isLost` em vez do nome "Perdido"; marcar a etapa "Perdido" com `isLost: true` no template padrão e no backfill de compatibilidade.
- UI: painel "Gerenciar etapas" acessível a partir do Kanban (`pipelines.manage`), com criar/renomear/reordenar/excluir.

## Fora de escopo

- Múltiplas etapas marcadas como `isWon`/`isLost` simultaneamente (mantém no máximo uma de cada, mas não força a interface a impedir manualmente — validado no servidor).
- Drag-and-drop de etapas (fica com botões subir/descer — suficiente para o volume atual de etapas por funil).
- Migração de oportunidades entre etapas ao excluir uma etapa com dados (etapa com oportunidade simplesmente não pode ser excluída nesta story).

## Critérios de aceite verificáveis

- Usuário com `pipelines.manage` cria uma etapa nova, que aparece no fim do Kanban do funil correto.
- Usuário renomeia/recolore/reajusta probabilidade de uma etapa existente e a mudança aparece imediatamente no Kanban.
- Usuário reordena uma etapa para cima/para baixo e a ordem das colunas do Kanban reflete a nova posição.
- Tentativa de excluir uma etapa com oportunidades retorna erro claro, sem excluir nada.
- Tentativa de excluir a última etapa restante do funil retorna erro claro, sem excluir nada.
- Marcar uma oportunidade como perdida continua movendo-a para a etapa `isLost` mesmo que essa etapa tenha sido renomeada.
- Todas as actions validam que a etapa/funil pertence à organização da sessão.
- Tipos, testes e build passam.

## Regras de autorização

- `pipelines.manage` para criar/editar/reordenar/excluir etapa (mesma chave de `CRM-F0-02`).
- `opportunities.read`/`pipelines.read` continuam suficientes para só visualizar.
- Toda action resolve `organizationId` via `requirePermission()` e confirma que a etapa/funil pertence a essa organização antes de qualquer leitura ou escrita — nunca confia em `pipelineId`/`stageId` vindos do cliente sem essa checagem (mesmo padrão corrigido em `CRM-F0-02` para `createOpportunity`/`moveOpportunity`).

## Alterações de banco

Nenhuma migration nova. `isLost` já existe na tabela `pipeline_stages` desde a fundação, só nunca foi escrita por nenhum código — passa a ser setada por esta story (dado novo em coluna existente, aditivo).

## Arquivos prováveis

- `src/server/actions/pipeline.ts` (novas actions + fix de `DEFAULT_STAGE_TEMPLATE`/backfill).
- `src/server/actions/pipeline.schemas.ts` (schemas de criar/editar etapa).
- `src/server/actions/opportunities.ts` (fix de `loseOpportunity`).
- `src/components/crm/pipeline/kanban-board.tsx` (ou novo componente `manage-stages-modal.tsx`).

## Plano de testes

- Unitário: schemas de criar/editar etapa (nome obrigatório, probabilidade 0-100, cor em formato hex opcional).
- Regressão: suíte completa (`vitest run`) continua verde.
- `tsc --noEmit`, `next build` verdes.
- Sem banco disponível nesta sessão — sem teste de integração real das actions (mesma limitação recorrente do projeto, documentada em todas as fases anteriores).

## Telemetria

Reaproveita `logActivity` existente apenas quando a mudança de etapa afeta uma oportunidade em curso (não se aplica à gestão de etapas em si, que é configuração, não evento de negócio).

## Migração

Nenhuma. Dado novo (`isLost = true`) é escrito de forma aditiva pelo bootstrap idempotente já existente (`ensureDefaultPipeline`) na próxima vez que rodar contra um banco real.

## Rollback

Reverter o commit. Nenhuma coluna nova, nenhum dado destrutivo — `isLost` volta a ficar `false`/não lido, sem quebrar nada que dependa dele (só o fix de `loseOpportunity`, que nesse caso volta ao comportamento anterior por nome).

## Feature flag

Não aplicável — ação de configuração restrita por permissão (`pipelines.manage`), não um recurso arriscado o suficiente para exigir flag.

## Dependências

Depende de `CRM-F0-02` (múltiplos funis, concluída) — etapas pertencem a um funil selecionável.

## Riscos

- Excluir a etapa `isWon` ou `isLost` por engano deixa `winOpportunity`/`loseOpportunity` sem etapa de destino (comportamento já existente: cai de volta pra etapa atual da oportunidade, não quebra, só não move visualmente). Mitigado nesta story apenas pela mensagem de confirmação na UI, não por um bloqueio de servidor dedicado (fora de escopo — ver "Fora de escopo").

## Definition of Done

- Critérios de aceite atendidos.
- Isolamento por organização testado (validação de posse em toda action nova).
- Testes de schema criados e passando.
- `tsc`/`vitest`/`build` verdes.
- Sem segredo no diff.
- `IMPLEMENTATION_STATUS.md` atualizado.
- Rollback praticável (reverter commit).

## Dev Agent Record

### File List

- `src/server/actions/pipeline.schemas.ts` — `createStageSchema`/`updateStageSchema`.
- `src/server/actions/pipeline.schemas.test.ts` — +8 testes (criação/edição de etapa).
- `src/server/actions/pipeline.ts` — `findOwnedStage()` (helper de posse), `createStage()`, `updateStage()`, `reorderStage()`, `deleteStage()`; `DEFAULT_STAGE_TEMPLATE` e o backfill da etapa "Perdido" passaram a gravar `isLost: true`.
- `src/server/actions/opportunities.ts` — `loseOpportunity()` agora busca a etapa de destino por `isLost = true` em vez do nome literal "Perdido".
- `src/components/crm/pipeline/manage-stages-modal.tsx` — novo, modal "Gerenciar Etapas" (editar nome/cor/probabilidade, subir/descer, excluir com confirmação inline, criar nova etapa).
- `src/components/crm/pipeline/kanban-board.tsx` — botão "Gerenciar Etapas", renderiza o novo modal.
- `src/app/crm/pipeline/page.tsx` — monta `stageDetails` (id/name/color/probability/isWon/isLost) a partir de `data.stages`, repassado ao `KanbanBoard`.

### Completion Notes

- Nenhuma migration: `isLost` já existia na tabela `pipeline_stages` desde a fundação, só nunca era escrita. Passa a ser gravada de forma aditiva pelo bootstrap idempotente (`ensureDefaultPipeline`) na próxima vez que rodar contra um banco real, e diretamente por `createPipeline`/`createStage` daqui em diante.
- **Bug real corrigido**: `loseOpportunity` dependia do nome literal `"Perdido"` para achar a etapa de destino — com etapas agora renomeáveis (esta story), isso quebraria silenciosamente (a oportunidade seria marcada como perdida mas ficaria "presa" visualmente na etapa antiga) assim que alguém renomeasse essa etapa. Corrigido para usar a flag `isLost`, no mesmo padrão que `winOpportunity` já usava com `isWon`.
- Reordenação implementada com 3 updates dentro de uma transação (posição temporária `-1`, fora da faixa válida) para não violar a constraint `unique(pipelineId, position)` ao trocar duas linhas de posição.
- `deleteStage` bloqueia com erro claro se a etapa tiver qualquer oportunidade vinculada, ou se for a última etapa restante do funil — nunca exclui silenciosamente nem migra oportunidades.
- Modal de gestão usa `router.refresh()` após cada ação em vez de tentar sincronizar manualmente o estado do drag-and-drop do Kanban (`stages` em `kanban-board.tsx`) — mais simples e evita risco de dessincronizar a UI otimista existente do DnD, ao custo de um round-trip a mais por ação de gestão (aceitável, não é um fluxo de alta frequência).
- Exclusão de etapa usa confirmação inline (sem `window.confirm`) — mesmo padrão já estabelecido no projeto para não travar automação de teste em telas novas.
- `tsc --noEmit`: limpo. `vitest run`: **72/72** (10 arquivos, +8 novos desta story). `next build`: verde, 31 rotas (sem rota nova). `biome lint` nos arquivos tocados: 0 erros.
- **Não validado com dado real**: mesma limitação já registrada em `CRM-F0-02` (sem `.env`/`DATABASE_URL` neste checkout, `.claude/launch.json` compartilhado aponta pra outro checkout).
- Nada commitado nem enviado ao GitHub nesta sessão além do commit local desta story.
