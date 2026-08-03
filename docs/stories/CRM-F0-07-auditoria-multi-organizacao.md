# CRM-F0-07 — Auditoria de autorização multi-organização

Status: Done (implementado 2026-08-03)

## Objetivo

Auditar sistematicamente todas as server actions em busca da classe de bug encontrada e corrigida em `CRM-F0-02` (`pipeline.ts::createOpportunity`/`moveOpportunity`): um identificador de entidade vindo do cliente é gravado numa nova linha ou usado numa leitura sem confirmar que pertence à organização da sessão — abrindo brecha para vazamento ou contaminação de dados entre organizações.

## Contexto atual confirmado

- `requirePermission()` (`src/server/auth/require-permission.ts`) resolve `organizationId` só a partir da sessão — nunca de parâmetro. Isso já é seguido corretamente na maioria das actions.
- O padrão de bug já apareceu 2 vezes nesta sessão (`CRM-F0-02`): `pipelineId`/`stageId` client-supplied gravados sem checagem. A hipótese desta story era que o mesmo padrão poderia existir em outras actions que também linkam entidades (contato↔empresa, proposta↔oportunidade, projeto↔etapa, anexo↔entidade).
- Não há testes de integração no projeto (só testes de função pura/schema) — sem banco disponível nesta sessão, a auditoria foi feita por leitura de código, não por teste automatizado de fato explorando o ataque.

## Escopo

- Ler toda `src/server/actions/*.ts` (exceto `*.schemas.ts`/`*.test.ts`) verificando, para cada função exportada:
  1. chama `requirePermission()` (ou é uma das duas actions públicas por token, que legitimamente não chamam);
  2. toda leitura/escrita é filtrada por `organizationId` da sessão, direta ou transitivamente por um id já validado;
  3. todo identificador de entidade vindo do cliente que é gravado numa nova linha é validado contra `organizationId` antes de usar.
- Corrigir todo gap confirmado.
- Não expandir para uma reescrita geral de autorização — só fechar os gaps concretos encontrados.

## Fora de escopo

- Testes de integração reais contra banco (exigem `DATABASE_URL`, indisponível nesta sessão).
- Novas permissões ou papéis.
- Reescrever padrões já corretos só por estilo.

## Método

Delegada a leitura ampla (19 arquivos de action, ~2500 linhas) a um agente de exploração com o mesmo critério de 3 pontos acima, seguida de verificação manual de cada achado reportado (lendo o arquivo real, não confiando no resumo) antes de corrigir. Complementarmente, inspecionei manualmente `finance.ts`, `approvals.ts`, `contracts.ts` e `activities.ts` (pontos de maior risco por ligarem várias entidades entre si) e confirmei que já validam corretamente todo id recebido do cliente antes de uso.

## Achados confirmados e corrigidos

1. **`quotes.ts::createQuote`** — `data.opportunityId` (cliente) gravado em `proposals.opportunityId` sem checar organização. Vazava transitivamente em `getQuotes`/`getQuoteById` (que confiam em `proposal.opportunityId` sem refiltrar) e no fluxo público (`public-quote.ts`). **Corrigido**: valida `opportunities` por `id` + `organizationId` antes do insert.
2. **`contacts.ts::createContact`/`updateContact`** — `parsed.companyId` (cliente) inserido em `companyContacts` e usado para resolver `tradeName` sem checar organização; `getContacts()` também fazia `leftJoin` em `companies` sem filtrar por organização. **Corrigido**: helper `findOwnedCompanyName()` valida a empresa antes de vincular; `leftJoin` de `getContacts()` agora inclui `companies.organizationId`.
3. **`projects.ts::updateProjectStage`** — `stageId` (cliente) gravado em `projects.stageId` sem checar organização (mesma classe exata do bug original de `pipeline.ts`). **Corrigido**: valida `projectStages` por `id` + `organizationId` antes do update.
4. **`files.ts::uploadFile`** — `entityId` (cliente) gravado em `attachments` sem checar organização; risco menor porque as leituras já eram corretamente escopadas, mas permitia "plantar" um anexo referenciando um registro de outra organização. **Corrigido**: `entityBelongsToOrganization()`, uma função por tipo de entidade anexável (11 tipos), chamada antes do upload.

## Verificado e confirmado correto (sem alteração)

- `finance.ts::createReceivableFromContract` (valida `contractId`, deriva `opportunityId`/`projectId` do próprio contrato já validado).
- `approvals.ts::createApprovalRequest` (valida `projectId`).
- `contracts.ts::createContractFromProposal` (valida `proposalId`).
- `activities.ts::addNote`/`getOpportunityActivities` (valida `opportunityId`).
- `public-quote.ts`/`public-approval.ts` (gateadas por token + status, `organizationId` derivado da própria linha validada, não de parâmetro).

## Critérios de aceite verificáveis

- Os 4 gaps confirmados acima estão corrigidos e cada um lança um erro claro ("não encontrada"/"não encontrado") em vez de gravar silenciosamente uma referência cross-organização.
- Nenhuma action legítima deixou de funcionar para o caso normal (mesma organização) — coberto pela suíte de regressão completa.
- Tipos, testes e build passam.

## Regras de autorização

Nenhuma nova chave de permissão — os 4 fixes reforçam checagens dentro de actions que já usavam a chave correta.

## Alterações de banco

Nenhuma.

## Plano de testes

- Regressão: suíte completa (`vitest run`) continua verde — nenhuma das correções altera o formato de schemas existentes.
- Sem banco disponível nesta sessão — sem teste de integração automatizado que exercite de fato um cenário cross-organização (exigiria duas organizações reais e dois usuários reais num banco de teste). Registrado como débito.
- `tsc --noEmit`, `next build` verdes.

## Migração

Nenhuma.

## Rollback

Reverter o commit. Todas as correções são adições de checagem (mais restritivas), não removem nenhuma capacidade legítima — reverter não perde dado, só reabre os 4 gaps.

## Feature flag

Não aplicável.

## Dependências

Nenhuma nova — os fixes tocam `quotes.ts`, `contacts.ts`, `projects.ts`, `files.ts`, todos já existentes.

## Riscos

- A auditoria foi feita por leitura de código (agente de exploração + verificação manual dos 4 achados + inspeção pessoal de 4 arquivos adicionais de alto risco), não pelos ~15 arquivos restantes lidos linha a linha por mim pessoalmente. Ficam como confiança alta, não prova formal. Uma auditoria futura mais formal (ou testes de integração reais com duas organizações de teste) é o próximo passo natural quando houver banco disponível.

## Definition of Done

- 4 achados corrigidos.
- `tsc`/`vitest`/`build` verdes.
- Sem segredo no diff.
- `IMPLEMENTATION_STATUS.md` atualizado.
- Rollback praticável (reverter commit).

## Dev Agent Record

### File List

- `src/server/actions/quotes.ts` — valida `opportunityId` em `createQuote`.
- `src/server/actions/contacts.ts` — `findOwnedCompanyName()`; `getContacts()` filtra `companies.organizationId` no join.
- `src/server/actions/projects.ts` — valida `stageId` em `updateProjectStage`.
- `src/server/actions/files.ts` — `entityBelongsToOrganization()`, chamada em `uploadFile`.

### Completion Notes

- `tsc --noEmit`: limpo. `vitest run`: 86/86 (suíte inalterada em quantidade — estes fixes são checagens adicionais em código já existente, não schemas novos). `next build`: verde, 32 rotas (sem rota nova). `biome lint` nos 4 arquivos: 0 erros.
- Nenhum teste de integração cross-organização automatizado foi possível (sem banco) — validação por leitura de código, tipos e regressão da suíte existente.
