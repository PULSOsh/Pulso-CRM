# CRM-F0-02 — Múltiplos funis comerciais

Status: Done (implementado 2026-08-03, aguardando validação com dado real e push do responsável)

## Objetivo

Permitir que a organização crie e alterne entre múltiplos funis comerciais sem intervenção no banco de dados.

## Critérios de aceite

- Usuário autorizado lista somente os funis ativos da própria organização.
- Novo funil é criado com nome válido e seis etapas comerciais padrão.
- O funil selecionado é carregado por identificador validado contra a organização atual.
- Seleção inválida não expõe dados e retorna ao funil padrão.
- A interface permite criar e alternar funis.
- Tipos, testes e build passam.

## Tarefas

- [x] Criar validação e actions de gestão de funis.
- [x] Permitir seleção segura no carregamento do Kanban.
- [x] Criar interface de seleção e criação.
- [x] Adicionar testes e executar regressão.

## Dev Agent Record

### File List

- `src/server/auth/permission-keys.ts` — novas chaves `pipelines.read`/`pipelines.manage`, concedidas a `owner`/`admin` (automático), `commercial` (read+manage), `projects` (read), `viewer` (read, automático por terminar em `.read`).
- `src/server/actions/pipeline.schemas.ts` — `createPipelineSchema`.
- `src/server/actions/pipeline.schemas.test.ts` — novo, 5 testes.
- `src/server/actions/pipeline.ts` — `getPipelines()`, `createPipeline()`, `ensureDefaultPipeline()` (extraído do bootstrap que já existia), `getPipelineWithOpportunities(pipelineId?)` agora aceita seleção opcional validada por organização + formato UUID.
- `src/app/crm/pipeline/page.tsx` — lê `pipelineId` de `searchParams`, busca lista de funis em paralelo, repassa para `KanbanBoard`.
- `src/components/crm/pipeline/kanban-board.tsx` — abas dinâmicas por funil (antes: "Comercial"/"Parcerias" hardcoded, ambas placeholder), navegação via `router.push(?pipelineId=)`, modal "Novo Funil".

### Completion Notes

- Schema (`pipelines`/`pipeline_stages`) já suportava múltiplos funis desde a fundação (`isDefault`/`isActive`) — nenhuma migration necessária, só passou a ser exercitado.
- `getPipelineWithOpportunities` nunca confia no `pipelineId` do cliente: valida formato UUID, depois confirma pertencimento à organização da sessão e `isActive = true`; qualquer seleção inválida cai silenciosamente em `ensureDefaultPipeline()` (mesmo funil padrão de sempre), sem vazar se o id existe em outra organização.
- `ensureDefaultPipeline()` ganhou um caso a mais que o bootstrap original: se a organização já tiver funil(s) mas nenhum marcado `isDefault` (dado anterior a esta story), reaproveita o mais antigo em vez de criar um segundo — evita duplicar "Funil Padrão" em orgs já existentes.
- **Bug de segurança real encontrado e corrigido no caminho**: `createOpportunity`/`moveOpportunity` recebiam `pipelineId`/`stageId` do cliente sem confirmar que pertenciam à organização da sessão. Com um único funil por organização (estado anterior a esta story) isso era inofensivo na prática; com múltiplos funis virou um vetor real de vazamento entre organizações (uma oportunidade com `pipelineId` de outra organização apareceria no Kanban alheio, já que `getPipelineWithOpportunities` filtra oportunidades só por `pipelineId`, sem `organizationId` na mesma query). Corrigido: `createOpportunity` agora confirma que `pipelineId` pertence à organização e que `stageId` pertence a esse `pipelineId` antes de inserir; `moveOpportunity` confirma que `newStageId` pertence ao `pipelineId` já gravado na oportunidade antes de mover.
- Todo novo funil (via `createPipeline`) nasce com as mesmas seis etapas padrão do `docs/MODULE_SPECIFICATIONS.md` §4 (Lead 10% → Perdido 0%), extraídas para `DEFAULT_STAGE_TEMPLATE` e reaproveitadas pelo bootstrap do funil default.
- `tsc --noEmit`: limpo. `vitest run`: 64/64 (todos os arquivos, +5 novos). `next build`: verde, 31 rotas (sem rota nova — só mudança de comportamento em `/crm/pipeline`). `biome check`/`lint` nos arquivos tocados: 0 erros de regra real; os erros de `format` que aparecem são drift de fim-de-linha CRLF/LF pré-existente em todo o checkout (documentado desde a Fase 2 parte 1c, `IMPLEMENTATION_STATUS.md` seção 14), confirmado reproduzível em arquivo não tocado (`opportunities.ts`) — não é regressão desta story.
- **Não validado com dado real**: sem `.env`/`DATABASE_URL` configurado nesta sessão (mesma limitação recorrente do projeto) e o `.claude/launch.json` na raiz `D:/PULSO` aponta o dev server `pipeline-crm-dev` para um checkout antigo diferente (`D:/PULSO/CRM/.../PULSO_CRM_STARTER_V2`), não este worktree (`D:/PULSO/_work/pulso-crm-friendly-errors-clean`) — não ajustado por ser configuração compartilhada fora do escopo desta story. Fluxo criar funil → alternar → criar oportunidade na aba nova não foi exercitado no navegador.
- Nada foi commitado nem enviado ao GitHub — aguardando decisão do responsável (ver protocolo do `CLAUDE.md` do projeto).
