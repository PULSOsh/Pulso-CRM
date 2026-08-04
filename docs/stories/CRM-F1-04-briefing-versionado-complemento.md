# CRM-F1-04 — Briefing versionado e solicitação de complemento

Status: Done (implementado 2026-08-04)

## Objetivo

Confirmar o versionamento de templates (já existia) e implementar a solicitação de complemento — pedir ao lead informações que faltaram, sem perder o rastro de que isso foi pedido.

## Achado (antes de implementar)

`briefingTemplateVersions` já implementa versionamento imutável de templates (`versionNumber`, `snapshot` jsonb, `publishedAt`) desde a fundação — essa parte da story já estava concluída, confirmado por leitura antes de tocar em código. O que faltava de verdade era "solicitação de complemento": não havia status, campo nem ação para isso.

## Escopo

- Novo valor de enum `needs_more_info` em `briefing_submission_status`.
- `briefingSubmissions.complementRequestedNote`/`complementRequestedAt` (novas colunas).
- `requestSubmissionComplement(id, { note })`: marca a submissão como `needs_more_info`, grava a nota interna do que falta.
- UI (`submission-details.tsx`): botão "Solicitar complemento" com nota inline (sem `window.prompt`), badge de status, exibição da nota quando presente.

## Fora de escopo

- Envio automático de e-mail/WhatsApp ao lead — SMTP não está configurado neste projeto (variáveis documentadas, nunca implementadas). O compartilhamento do protocolo/link com o lead segue o mesmo padrão manual já estabelecido para propostas/contratos ("copiar link/WhatsApp", ação client-side).
- Página pública de retomada por protocolo (`allowResume` no template já existe no schema, mas nenhuma rota pública usa isso — é uma feature maior e separada, não pedida explicitamente por esta story).

## Critérios de aceite verificáveis

- Solicitar complemento muda o status pra `needs_more_info` e grava a nota.
- A nota aparece na tela de detalhe da submissão.
- Aprovar uma submissão continua funcionando independente do status anterior (solicitar complemento não bloqueia aprovação posterior).
- Tipos, testes e build passam.

## Regras de autorização

`briefings.review` (mesma chave já usada por `approveBriefingSubmission`).

## Alterações de banco

- Novo valor de enum + 2 colunas nullable em `briefing_submissions`. Migration aditiva gerada (`0008_soft_excalibur.sql`), **não aplicada**.
- Nota operacional: `ALTER TYPE ... ADD VALUE` não pode rodar dentro da mesma transação que usa o valor novo (limitação do Postgres) — verificar se `drizzle-kit migrate` trata isso automaticamente ou se essa migration precisa ser aplicada separadamente, no momento em que alguém for aplicá-la de verdade.

## Plano de testes

- Unitário: `requestComplementSchema` (nota obrigatória, mínimo 3 caracteres, máximo 1000) — 3 testes.
- Regressão: suíte completa (`vitest run`) continua verde.
- `tsc --noEmit`, `next build` verdes.
- Sem banco disponível nesta sessão.

## Migração / Rollback / Feature flag

Migration aditiva. Reverter o commit não afeta nenhuma submissão real (nenhuma foi processada nesta sessão).

## Dependências

Nenhuma.

## Riscos

- Nenhum novo status bloqueia nenhum fluxo existente — `needs_more_info` é só mais um valor possível, tratado como "ainda não vinculada" (`isLinked` continua checando só `status === "linked"`).

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

- `src/server/db/schema/enums.ts` — +`needs_more_info`.
- `src/server/db/schema/briefings.ts` — +`complementRequestedNote`/`complementRequestedAt`.
- `src/server/db/migrations/0008_soft_excalibur.sql` — gerada, não aplicada.
- `src/server/actions/briefing-submissions.schemas.ts` + `.test.ts` — novo.
- `src/server/actions/briefing-submissions.ts` — +`requestSubmissionComplement`.
- `src/components/crm/briefings/submission-details.tsx` — UI de solicitar complemento.

### Completion Notes

- `tsc --noEmit`: limpo. `vitest run`: **106/106** (+3 novos). `next build`: verde, 32 rotas (sem rota nova). `biome lint`: 0 erros.
- Verificação via `playwright test` (guard/login) adiada para um lote único no fim das stories F1-04 a F1-10 desta sessão — economiza reinícios repetidos do servidor local sem perder verificação real (o guard de rotas não muda entre essas stories).
- **Não validado com dado real**: mesma limitação de toda a sessão.