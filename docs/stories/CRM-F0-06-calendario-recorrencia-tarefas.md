# CRM-F0-06 — Calendário e recorrência de tarefas

Status: Done (implementado 2026-08-03, migration gerada mas não aplicada, aguardando validação com dado real e push do responsável)

## Objetivo

Dar visão de calendário sobre as tarefas do usuário e permitir marcar uma tarefa como recorrente, gerando automaticamente a próxima ocorrência quando a atual é concluída.

## Usuário e valor

Quem trabalha por prazos (ligações semanais, follow-up mensal, revisão recorrente de contrato) precisa ver o que vem pela frente organizado por dia, e não recriar manualmente a mesma tarefa toda semana.

## Contexto atual confirmado

- `tasks.recurrenceRule` existe no schema desde a fundação (`text`, livre) mas **nunca foi lido nem escrito por nenhum código** — mesmo padrão de tabela/coluna pronta sem uso já visto várias vezes neste projeto.
- `docs/PLANO_MESTRE_EVOLUCAO_CRM.md` §6 lista `task_recurrences` como entidade nova prioritária — um modelo estruturado, não o campo de texto livre já existente. Esta story cria essa tabela em vez de tentar interpretar texto livre (mais seguro e testável).
- Não existe nenhuma visão de calendário hoje — só listas ("Minhas tarefas"/"Atrasadas"/"Concluídas", esta última da `CRM-F0-04`).

## Escopo

- Nova tabela `task_recurrences` (frequência diária/semanal/mensal, intervalo, data-limite opcional) — uma regra por tarefa "atual" da série.
- `setTaskRecurrence(taskId, input)` / `clearTaskRecurrence(taskId)`.
- `completeTask()` estendido: se a tarefa concluída tem recorrência ativa (e a próxima data não passa da data-limite, se houver), cria automaticamente a próxima ocorrência (cópia dos campos relevantes, nova `dueAt` calculada) e move a regra de recorrência para apontar pra essa nova tarefa.
- Função pura `calculateNextDueDate(from, frequency, interval)`, testada isoladamente.
- Nova rota `/crm/tarefas/calendario`: grade mensal (semana começando domingo), tarefas em aberto (`todo`/`doing`) do usuário posicionadas no dia do prazo, navegação mês anterior/seguinte.
- UI de criar tarefa ganha opção "Repetir" (frequência, intervalo, até quando - opcional).

## Fora de escopo

- Recorrência baseada em dias da semana específicos (ex.: "toda terça e quinta") — só frequência simples (diária/semanal/mensal) × intervalo.
- Edição de uma ocorrência já gerada afetando as futuras (cada ocorrência é independente depois de criada).
- Arrastar tarefa no calendário para mudar o prazo (só visualização nesta story).
- Sincronização com calendário externo (Google/Outlook) — fora do roadmap desta fase.

## Critérios de aceite verificáveis

- Marcar uma tarefa como recorrente (ex.: semanal, intervalo 1) e completá-la cria automaticamente uma nova tarefa com o mesmo título, responsável e vínculo, com `dueAt` 7 dias após o prazo anterior.
- Tarefa recorrente com data-limite não gera nova ocorrência após essa data.
- Tarefa sem recorrência continua sendo concluída normalmente, sem nenhuma tarefa nova criada (comportamento inalterado).
- `/crm/tarefas/calendario` mostra as tarefas em aberto do usuário no dia correto do mês corrente, com navegação para mês anterior/seguinte.
- Toda action confirma que a tarefa pertence à organização da sessão antes de ler/escrever.
- Tipos, testes e build passam.

## Regras de autorização

- `tasks.update` para definir/limpar recorrência (é uma configuração da tarefa, mesma chave que edição).
- `tasks.read` para o calendário (mesma chave das listas existentes).
- `tasks.complete` continua sendo a chave de `completeTask` (a geração da próxima ocorrência é um efeito colateral da conclusão, não uma ação separada que precise de permissão própria).

## Alterações de banco

- Nova tabela `task_recurrences` (id, organization_id, task_id uuid único FK `tasks.id` cascade, frequency enum, interval smallint default 1, until timestamp nullable, created_at, updated_at). Migration aditiva gerada via `drizzle-kit generate`, **não aplicada** nesta sessão.

## Arquivos prováveis

- `src/server/db/schema/enums.ts` (+`taskRecurrenceFrequencyEnum`).
- `src/server/db/schema/task-recurrences.ts` (novo).
- `src/server/db/schema/index.ts` (export).
- `src/server/services/recurrence.ts` (+teste).
- `src/server/actions/tasks.schemas.ts` (+schema de recorrência).
- `src/server/actions/tasks.ts` (+`setTaskRecurrence`/`clearTaskRecurrence`, `completeTask` estendido, `getTasksForMonth`).
- `src/app/crm/tarefas/calendario/page.tsx` (novo) + `src/components/crm/tasks/calendar-client.tsx` (novo).
- `src/components/crm/tasks/tasks-client.tsx` (opção "Repetir" no formulário de criar tarefa).

## Plano de testes

- Unitário: `calculateNextDueDate` (diário/semanal/mensal, intervalo > 1, mudança de mês/ano).
- Unitário: schema de recorrência (frequência inválida, intervalo ≤ 0, data-limite no passado).
- Regressão: suíte completa (`vitest run`) continua verde.
- `tsc --noEmit`, `next build` verdes.
- Sem banco disponível nesta sessão — sem teste de integração real da geração automática de ocorrência.

## Telemetria

Reaproveita `logActivity`/`writeAuditLog` já usados por `completeTask` — a criação automática da próxima ocorrência é mencionada no mesmo evento de conclusão, sem evento novo dedicado.

## Migração

Nenhuma migração de dado — tabela nova, vazia. Tarefas existentes simplesmente não têm recorrência até que alguém configure uma.

## Rollback

Reverter o commit. Tabela nova sem dado real ainda — sem risco de perda.

## Feature flag

Não aplicável.

## Dependências

Depende de `CRM-F0-04` (conclusão/reabertura de tarefas) — a geração de ocorrência acontece dentro de `completeTask`.

## Riscos

- Se `dueAt` da tarefa original for nulo, a próxima ocorrência é calculada a partir do momento da conclusão (`now()`) em vez do prazo original — comportamento razoável (não há prazo anterior pra somar), documentado na Nota de implementação.

## Definition of Done

- Critérios de aceite atendidos.
- Migration gerada (não aplicada sem autorização).
- Testes de função pura e de schema criados e passando.
- `tsc`/`vitest`/`build` verdes.
- Sem segredo no diff.
- `IMPLEMENTATION_STATUS.md` atualizado.
- Rollback praticável (reverter commit).

## Dev Agent Record

### File List

- `src/server/db/schema/enums.ts` — +`taskRecurrenceFrequencyEnum`.
- `src/server/db/schema/task-recurrences.ts` — novo.
- `src/server/db/schema/index.ts` — export.
- `src/server/db/migrations/0006_parched_the_captain.sql` — gerada, **não aplicada**.
- `src/server/services/recurrence.ts` + `.test.ts` — `calculateNextDueDate` pura, 5 testes.
- `src/server/actions/tasks.schemas.ts` — `taskRecurrenceSchema`.
- `src/server/actions/tasks.schemas.test.ts` — +5 testes.
- `src/server/actions/tasks.ts` — `setTaskRecurrence`, `clearTaskRecurrence`, `getTasksForMonth`; `completeTask` estendido (dentro de uma transação) para gerar a próxima ocorrência quando há recorrência ativa.
- `src/app/crm/tarefas/calendario/page.tsx` + `src/components/crm/tasks/calendar-client.tsx` — novos, grade mensal com navegação.
- `src/components/crm/tasks/tasks-client.tsx` — link "Calendário", opção "Repetir" no formulário de criar tarefa.

### Completion Notes

- `task_recurrences` é uma tabela nova (não reaproveita `tasks.recurrenceRule`, texto livre nunca usado) — decisão registrada na story, seguindo `docs/PLANO_MESTRE_EVOLUCAO_CRM.md` §6, que já listava essa entidade como prioritária.
- `completeTask` agora roda inteiramente dentro de uma `db.transaction` (antes não estava) — necessário porque a geração da próxima ocorrência (insert em `tasks` + update em `task_recurrences`) precisa ser atômica junto com a conclusão da tarefa atual; se qualquer parte falhar, nada é gravado.
- Se a tarefa original não tinha `dueAt`, a próxima ocorrência é calculada a partir do momento da conclusão (`new Date()`), não de um prazo anterior inexistente — documentado como risco aceito na story.
- Calendário mostra só tarefas `status = "todo"` (mesma convenção de `getMyTasks`/`getOverdueTasks"; `"doing"` nunca é usado em nenhum lugar do código, confirmado por busca antes de decidir o filtro).
- Grade do calendário (semana começando domingo) é calculada tanto no servidor (`getTasksForMonth`, pra delimitar a busca) quanto no cliente (`CalendarClient`, pra desenhar os dias) com a mesma convenção (`weekStartsOn: 0`) — não há um helper compartilhado único, mas ambos os cálculos são triviais (`date-fns`) e usam a mesma constante, risco baixo de divergência.
- `tsc --noEmit`: limpo. `vitest run`: **86/86** (11 arquivos, +10 novos desta story). `next build`: verde, **32 rotas** (+1, `/crm/tarefas/calendario`). `biome lint` nos arquivos tocados: 0 erros.
- Migration `0006_parched_the_captain.sql` gerada (enum novo + tabela nova, sem `ALTER` em tabela existente além das FKs da própria tabela nova) — soma-se a `0003`/`0004`/`0005` como pendente de autorização explícita.
- **Não validado com dado real nem visualmente**: mesma limitação de `.env`/`DATABASE_URL` já registrada em `CRM-F0-02`/`03`/`04`. Tentativa de abrir a página no preview do navegador falhou porque o `.claude/launch.json` compartilhado (`D:/PULSO/.claude/launch.json`, fora deste projeto) aponta a config `pulso-crm-dev` para um checkout antigo diferente (`D:/PULSO/CRM/.../PULSO_CRM_STARTER_V2`, que ainda existe no disco) — não corrigido por ser configuração compartilhada entre projetos, fora do escopo desta story; fica registrado para decisão do responsável.
