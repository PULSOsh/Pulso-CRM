# CRM-F1-03 — Briefing vinculado à oportunidade

Status: Done (auditado e corrigido 2026-08-04 — a funcionalidade já existia; 2 bugs reais encontrados e corrigidos)

## Objetivo

Confirmar que uma submissão de briefing pode ser convertida em contato + empresa + oportunidade, e corrigir qualquer gap real encontrado na auditoria — sem reconstruir o que já funciona.

## Achado da auditoria (antes de escrever qualquer código novo)

Diferente da hipótese inicial ("nenhuma ação liga submissão → oportunidade"), a leitura completa de `src/server/actions/briefing-submissions.ts` e `src/components/crm/briefings/submission-details.tsx` mostrou que **a conversão já existe e está com UI real**: `approveBriefingSubmission()` já cria/vincula contato (por e-mail), cria empresa (se houver nome), cria a oportunidade e marca a submissão como `linked`; o botão "Aprovar e Converter" já chama essa action. Corrigir a suposição inicial evitou duplicar uma feature que já funciona.

A auditoria encontrou, porém, **2 bugs reais**:

1. **Funil errado num mundo multi-funil**: `approveBriefingSubmission` buscava `db.query.pipelines.findFirst({ where: eq(pipelines.organizationId, organizationId) })` — sem filtrar por `isDefault`. Antes de `CRM-F0-02` (múltiplos funis) isso era inofensivo, porque só existia um funil por organização. Depois de `CRM-F0-02`, um lead aprovado por briefing podia cair num funil secundário aleatório em vez do funil principal.
2. **Sem transação**: contato, empresa, oportunidade e atualização da submissão eram 4 escritas separadas, sem `db.transaction`. Uma falha no meio do caminho (ex.: inserção da oportunidade) deixava contato/empresa criados órfãos, sem vínculo com a submissão, e a submissão continuava "não vinculada" — uma nova tentativa não duplicaria o contato (já busca por e-mail), mas duplicaria a empresa (sem checagem de duplicidade nessa etapa).

## Escopo

- `approveBriefingSubmission` passa a reaproveitar `ensureDefaultPipeline()` (exportado de `pipeline.ts`, `CRM-F0-02`/`F0-03`) em vez de buscar "o primeiro funil" sem filtro — garante o funil padrão de verdade, com a mesma semântica de bootstrap (etapa "Perdido"/`isLost`, fallback pro funil mais antigo).
- As 4 escritas (contato, empresa, oportunidade, submissão) passam a rodar dentro de `db.transaction`.

## Fora de escopo

- Vincular uma submissão a uma oportunidade **já existente** (hoje sempre cria uma nova) — é uma capacidade distinta ("vincular a existente" vs. "criar e vincular"), não pedida explicitamente pelo texto da story, registrada como possível upgrade futuro.
- Merge de empresa duplicada na conversão (mesma decisão de escopo de `CRM-F1-01`: deduplicação na importação, não merge de registros já existentes).
- Log de atividade dedicado para a conversão em si — a oportunidade recém-criada já é visível no painel de "Vínculos" existente; não há um evento de `activities` específico para "oportunidade criada a partir de briefing" (mesmo padrão de `createOpportunity` no Kanban, que também não gera activity própria).

## Critérios de aceite verificáveis

- Aprovar uma submissão cria a oportunidade no funil **marcado como padrão** da organização, mesmo quando existem múltiplos funis.
- Se a inserção da oportunidade falhar por qualquer motivo, nenhum contato/empresa órfão fica criado (tudo ou nada).
- Comportamento para o caso comum (organização com um funil só) permanece idêntico ao anterior.
- Tipos, testes e build passam.

## Regras de autorização

Sem mudança — `briefings.review` continua sendo a chave exigida.

## Alterações de banco

Nenhuma.

## Plano de testes

- Regressão: suíte completa (`vitest run`) continua verde — nenhum schema/validação nova para testar isoladamente (é uma correção de orquestração/transação, não de regra de validação).
- `tsc --noEmit`, `next build`, `playwright test` verdes.
- Sem banco disponível nesta sessão — sem teste de integração real do fluxo completo de aprovação (mesma limitação recorrente do projeto).

## Migração / Rollback / Feature flag

Nenhuma migração. Reverter o commit volta ao comportamento anterior (com os 2 bugs) — sem perda de dado, já que nenhuma submissão real foi processada nesta sessão.

## Dependências

Depende de `ensureDefaultPipeline` estar exportado (`CRM-F0-02`/`F0-03`, já commitado nesta sessão).

## Riscos

- Nenhum risco novo introduzido — a mudança é estritamente mais correta que o comportamento anterior (funil certo, atomicidade), sem alterar a interface pública da action nem o formato de retorno.

## Definition of Done

- 2 bugs corrigidos e verificados por leitura de código + regressão.
- `tsc`/`vitest`/`playwright`/`build` verdes.
- Sem segredo no diff.
- `IMPLEMENTATION_STATUS.md` atualizado.
- Rollback praticável (reverter commit).

## Dev Agent Record

### File List

- `src/server/actions/pipeline.ts` — `ensureDefaultPipeline` passa a ser exportada.
- `src/server/actions/briefing-submissions.ts` — usa `ensureDefaultPipeline`; toda a conversão roda em `db.transaction`.

### Completion Notes

- `tsc --noEmit`: limpo. `vitest run`: 103/103 (inalterado — correção de orquestração, sem schema novo). `next build`: verde, 32 rotas (sem rota nova). `biome lint`: 0 erros. `npx playwright test`: 6/6.
- **Não validado com dado real**: mesma limitação de `.env`/`DATABASE_URL` de toda a sessão — não foi possível aprovar uma submissão real e confirmar o funil/transação com dado de verdade.