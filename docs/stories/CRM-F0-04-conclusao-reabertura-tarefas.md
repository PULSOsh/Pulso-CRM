# CRM-F0-04 — Conclusão, reabertura e histórico de tarefas

Status: Done (implementado 2026-08-03, migration gerada mas não aplicada, aguardando validação com dado real e push do responsável)

## Objetivo

Tornar a conclusão de tarefas auditável (autor + horário) e permitir reabrir uma tarefa concluída por engano, com justificativa obrigatória e trilha auditável — conforme `docs/MODULE_SPECIFICATIONS.md` §5: "Conclusão registra autor e horário. Reabertura é auditada."

## Usuário e valor

Quem conclui uma tarefa por engano (ou porque o cliente pediu para reabrir um pendente) precisa poder desfazer isso sem perder o rastro de quem fez o quê — hoje `completeTask()` marca `done` sem nenhum registro de autor além do `updatedAt`, e não existe ação nenhuma para reabrir.

## Contexto atual confirmado

- `tasks` já tem `completedAt`, mas **não tem `completedBy`** — a spec pede "autor e horário", só o horário existe hoje.
- `completeTask()` não escreve nenhum log/auditoria — nem `activities` (que `createTask()` já escreve quando há `opportunityId`) nem `audit_logs` (serviço `writeAuditLog`, já usado em 4 outros pontos críticos do sistema: aceite de proposta, assinatura de contrato, decisão de aprovação, baixa/estorno de parcela).
- Não existe `reopenTask()` nem visão "Concluídas" na tela `/crm/tarefas` — `getMyTasks`/`getOverdueTasks` só retornam `status = "todo"`, então uma tarefa concluída simplesmente desaparece da UI, sem como reabri-la.

## Escopo

- Migration aditiva: `tasks.completed_by` (uuid, FK `users.id`, nullable, `on delete set null` — mesmo padrão de `assigned_to`/`created_by`).
- `completeTask(taskId)`: grava `completedBy = userId` além de `completedAt`; escreve `audit_logs` (`task.completed`); escreve `activities` só quando a tarefa tem `opportunityId` (mesma condição já usada em `createTask`).
- `reopenTask(taskId, reason)`: exige motivo (schema, não opcional); volta `status` para `todo`, limpa `completedAt`/`completedBy`; escreve `audit_logs` (`task.reopened`, motivo no `after`); escreve `activities` quando há `opportunityId`.
- `getCompletedTasks()`: lista tarefas concluídas do usuário (mesmo padrão de `getMyTasks`).
- UI: nova aba "Concluídas" em `/crm/tarefas`, botão "Reabrir" com motivo inline (sem `window.prompt`).

## Fora de escopo

- Checklist de tarefa, recorrência real, calendário, lembretes (débitos já registrados em sessões anteriores, não expandidos aqui).
- Reabertura de tarefas de outros usuários (só a própria tarefa concluída, mesma regra de posse que `completeTask` já aplica implicitamente via `organizationId` — sem `assignedTo` na cláusula `where` porque `completeTask` também não tinha essa checagem; mantido igual para não mudar comportamento não relacionado a esta story).

## Critérios de aceite verificáveis

- Completar uma tarefa grava `completedBy` = usuário da sessão, além de `completedAt`.
- Completar uma tarefa gera uma linha em `audit_logs` com ação `task.completed`.
- Reabrir uma tarefa sem motivo é rejeitado pelo schema, sem chamar o banco.
- Reabrir uma tarefa com motivo volta o `status` para `todo`, limpa `completedAt`/`completedBy`, e gera uma linha em `audit_logs` com ação `task.reopened` e o motivo em `after`.
- A aba "Concluídas" em `/crm/tarefas` lista as tarefas concluídas do usuário, com botão "Reabrir".
- Toda action confirma `organizationId` da sessão antes de ler/escrever (nunca confia em `taskId` sozinho).
- Tipos, testes e build passam.

## Regras de autorização

- `tasks.complete` cobre tanto completar quanto reabrir (mesmos atores, ação inversa da mesma operação) — sem nova chave de permissão.

## Alterações de banco

- Nova coluna `tasks.completed_by` (uuid, FK `users.id`, `on delete set null`, nullable). Migration gerada via `drizzle-kit generate`, **não aplicada** nesta sessão (sem banco disponível; aplicar exige autorização explícita, conforme `docs/runbooks/production-safety.md`).

## Arquivos prováveis

- `src/server/db/schema/tasks.ts` (+coluna).
- `src/server/actions/tasks.schemas.ts` (+`reopenTaskSchema`).
- `src/server/actions/tasks.schemas.test.ts`.
- `src/server/actions/tasks.ts` (+`reopenTask`, `getCompletedTasks`; `completeTask` reescrito).
- `src/components/crm/tasks/tasks-client.tsx` (+aba "Concluídas", botão reabrir com motivo inline).
- `src/app/crm/tarefas/page.tsx` (+`getCompletedTasks`).

## Plano de testes

- Unitário: `reopenTaskSchema` (motivo obrigatório, limite de tamanho).
- Regressão: suíte completa (`vitest run`) continua verde.
- `tsc --noEmit`, `next build` verdes.
- Sem banco disponível nesta sessão — sem teste de integração real das actions (limitação recorrente do projeto).

## Telemetria

`audit_logs` (via `writeAuditLog`, já existente) para `task.completed`/`task.reopened`; `activities` (via `logActivity`, já existente) só quando a tarefa está vinculada a uma oportunidade — mesma condição já usada em `createTask`.

## Migração

Migration aditiva gerada (nova coluna nullable, sem dado). Nenhuma migração de dado necessária — tarefas já concluídas antes desta story simplesmente ficam com `completed_by = null` (informação que nunca existiu, não é uma regressão).

## Rollback

Reverter o commit. A coluna `completed_by`, se a migration chegar a ser aplicada, pode ficar sem uso sem quebrar nada (nullable, sem constraint que dependa dela).

## Feature flag

Não aplicável.

## Dependências

Nenhuma (independente de `CRM-F0-02`/`CRM-F0-03`).

## Riscos

- Nenhuma migração de dado; nenhuma tarefa existente é afetada até que alguém complete/reabra depois desta mudança.

## Definition of Done

- Critérios de aceite atendidos.
- Migration gerada (não aplicada sem autorização).
- Testes de schema criados e passando.
- `tsc`/`vitest`/`build` verdes.
- Sem segredo no diff.
- `IMPLEMENTATION_STATUS.md` atualizado.
- Rollback praticável (reverter commit).

## Dev Agent Record

### File List

- `src/server/db/schema/tasks.ts` — +`completedBy` (uuid, FK `users.id`, `on delete set null`).
- `src/server/db/migrations/0005_square_sugar_man.sql` — gerada via `drizzle-kit generate`, **não aplicada**.
- `src/server/actions/tasks.schemas.ts` — `reopenTaskSchema`.
- `src/server/actions/tasks.schemas.test.ts` — +4 testes.
- `src/server/actions/tasks.ts` — `getCompletedTasks()`; `completeTask()` grava `completedBy` + `audit_logs` (`task.completed`) + `activities` condicional (só com `opportunityId`); `reopenTask()` novo (motivo obrigatório, só reabre tarefa com `status = "done"`, grava `audit_logs` `task.reopened` com o motivo, `activities` condicional).
- `src/app/crm/tarefas/page.tsx` — busca `getCompletedTasks()` em paralelo, repassa pro client.
- `src/components/crm/tasks/tasks-client.tsx` — aba "Concluídas", componente `ReopenControl` (motivo inline, sem `window.prompt`, botão só habilita com motivo ≥ 3 caracteres — mesmo limite mínimo do schema, checado no cliente só pra UX, a validação real é sempre no servidor).

### Completion Notes

- Fecha a lacuna citada literalmente em `docs/MODULE_SPECIFICATIONS.md` §5: "Conclusão registra autor e horário. Reabertura é auditada." — antes só o horário (`completedAt`) existia, sem autor, e não havia reabertura nenhuma.
- Reaproveita `writeAuditLog`/`audit_logs` (já usado em 4 outros pontos críticos: aceite de proposta, assinatura de contrato, decisão de aprovação, baixa/estorno de parcela) em vez de criar uma tabela de histórico dedicada para tarefas — segue a regra do plano mestre de reutilizar padrões existentes.
- `reopenTask` só aceita reabrir uma tarefa cujo `status` atual seja `"done"` (cláusula `where` inclui essa checagem) — tentar reabrir uma tarefa já `"todo"`/`"doing"`/`"cancelled"` retorna o mesmo erro "não encontrada ou não está concluída", sem distinguir os casos (evita um oráculo de enumeração desnecessário sobre o estado exato de uma tarefa que não é sua).
- `completeTask`/`reopenTask` não checam `assignedTo` na cláusula `where` (só `organizationId`) — **mesmo comportamento que já existia antes desta story**, não uma regressão introduzida aqui; qualquer membro da organização com `tasks.complete` pode completar/reabrir a tarefa de outro colega, o que pode ou não ser intencional (registrado como possível item para uma futura auditoria de autorização, não corrigido aqui pra não misturar com o escopo desta story).
- `tsc --noEmit`: limpo. `vitest run`: **76/76** (+4 novos). `next build`: verde, 31 rotas (sem rota nova). `biome lint` nos arquivos tocados: 0 erros.
- Migration `0005_square_sugar_man.sql` gerada (`ALTER TABLE tasks ADD COLUMN completed_by` + FK), puramente aditiva, **não aplicada em nenhum ambiente** — mesma política das migrations `0003`/`0004` já pendentes de autorização explícita.
- **Não validado com dado real**: mesma limitação já registrada em `CRM-F0-02`/`CRM-F0-03`.
