# CRM-F1-02 — Motivos de perda configuráveis

Status: Done (implementado 2026-08-04, aguardando validação com dado real e push do responsável)

## Objetivo

Substituir o texto livre puro de "motivo da perda" por uma lista configurável de motivos (com opção de digitar um motivo novo e salvá-lo para reuso), permitindo agregação confiável em relatórios futuros.

## Contexto atual confirmado

- `loseOpportunity` já exigia um motivo, mas só como texto livre (`opportunities.lostReason`, varchar) — sem lista gerenciável, dois usuários escrevendo "sem orçamento" e "cliente sem verba" geram motivos que parecem diferentes num relatório.
- `docs/PLANO_MESTRE_EVOLUCAO_CRM.md` §6 já lista `pipeline_loss_reasons` como entidade nova prioritária — confirmando que uma tabela dedicada era o design pretendido, não continuar só com texto livre.

## Escopo

- Nova tabela `pipeline_loss_reasons` (label único por organização, `isActive` para desativar sem quebrar histórico).
- `getLossReasons()`: lista motivos ativos, semeando 6 motivos padrão na primeira chamada de cada organização (mesmo padrão idempotente de `ensureDefaultPipeline`).
- `createLossReason(label)` / `deactivateLossReason(id)`.
- `opportunities.lostReasonId` (nova coluna, FK nullable) — `lostReason` (texto) continua sendo gravado sempre, por compatibilidade e simplicidade de exibição; `lostReasonId` é adicional, para agregação futura.
- UI: modal de "Motivo da perda" ganha um `<select>` com os motivos configurados; escolher um preenche o texto (editável); editar o texto depois de escolher desvincula o `lostReasonId` (deixa de ser "exatamente esse motivo configurado"); se o texto final não corresponde a nenhum motivo já escolhido, aparece a opção "Adicionar '...' à lista de motivos".

## Fora de escopo

- Tela dedicada de gestão de motivos (criar/desativar acontece inline no próprio fluxo de perda, sem uma página `/crm/configuracoes` separada — ainda não existe).
- Relatório agregando por `lostReasonId` (a coluna existe agora; o relatório em si é trabalho futuro, quando houver dado real pra agregar).
- Reordenar motivos (lista ordenada alfabeticamente, sem posição manual — diferente de etapas do funil, motivos de perda não têm uma ordem funcional intrínseca).

## Critérios de aceite verificáveis

- Marcar uma oportunidade como perdida sem escolher nenhum motivo da lista continua funcionando exatamente como antes (só texto livre) — comportamento anterior preservado.
- Escolher um motivo da lista e confirmar grava `lostReasonId` apontando pra esse motivo.
- Editar o texto depois de escolher um motivo da lista limpa `lostReasonId` (evita gravar um id que não corresponde mais ao texto).
- Marcar a caixa "Adicionar à lista" cria o motivo (`pipelines.manage`) antes de gravar a perda, e a próxima oportunidade perdida já vê esse motivo na lista.
- `lostReasonId` recebido do cliente é validado contra a organização da sessão antes de gravar.
- Tipos, testes e build passam.

## Regras de autorização

- `opportunities.lose` continua sendo a chave pra marcar como perdida (sem mudança).
- `pipelines.manage` (mesma chave já usada para gerenciar etapas do funil, `CRM-F0-03`) para criar/desativar motivo — reaproveitada por ser conceitualmente a mesma categoria de configuração do funil comercial.

## Alterações de banco

- Nova tabela `pipeline_loss_reasons` + nova coluna `opportunities.lost_reason_id` (FK nullable). Migration aditiva gerada (`0007_public_hulk.sql`), **não aplicada** nesta sessão.

## Plano de testes

- Unitário: `loseOpportunitySchema` com `lostReasonId` opcional (uuid válido/invalido, compatibilidade sem o campo) — 3 testes novos.
- Regressão: suíte completa (`vitest run`) continua verde.
- `tsc --noEmit`, `next build`, `playwright test` verdes.
- Sem banco disponível nesta sessão — sem teste de integração real do fluxo de perda com motivo configurado.

## Migração / Rollback / Feature flag

Migration aditiva (tabela nova + coluna nullable). Reverter o commit não afeta nenhuma oportunidade já marcada como perdida antes desta story (elas simplesmente não têm `lostReasonId`, que é opcional).

## Dependências

Reaproveita a permissão `pipelines.manage` de `CRM-F0-03`.

## Riscos

- Sem tela de gestão dedicada, motivos só podem ser criados a partir do próprio fluxo de perda (não há como pré-cadastrar uma lista completa antes do primeiro uso real) — aceitável para o volume atual, registrado como possível upgrade futuro.

## Definition of Done

- Critérios de aceite atendidos.
- Migration gerada (não aplicada sem autorização).
- Testes de schema criados e passando.
- `tsc`/`vitest`/`playwright`/`build` verdes.
- Sem segredo no diff.
- `IMPLEMENTATION_STATUS.md` atualizado.
- Rollback praticável (reverter commit).

## Dev Agent Record

### File List

- `src/server/db/schema/loss-reasons.ts` — novo.
- `src/server/db/schema/opportunities.ts` — +`lostReasonId`.
- `src/server/db/schema/index.ts` — export.
- `src/server/db/migrations/0007_public_hulk.sql` — gerada, não aplicada.
- `src/server/actions/loss-reasons.ts` — novo (`getLossReasons`/`createLossReason`/`deactivateLossReason`).
- `src/server/actions/opportunities.schemas.ts` — +`lostReasonId` opcional.
- `src/server/actions/opportunities.schemas.test.ts` — +3 testes.
- `src/server/actions/opportunities.ts` — `loseOpportunity` valida e grava `lostReasonId`.
- `src/components/crm/pipeline/win-lose-buttons.tsx` — select de motivos + opção de salvar novo.
- `src/app/crm/opportunities/[id]/page.tsx` — busca `getLossReasons()`, repassa pro componente.

### Completion Notes

- `tsc --noEmit`: limpo. `vitest run`: **103/103** (+3 novos). `next build`: verde, 32 rotas (sem rota nova). `biome lint`: 0 erros. `npx playwright test`: 6/6.
- **Não validado com dado real**: mesma limitação de `.env`/`DATABASE_URL` de toda a sessão.