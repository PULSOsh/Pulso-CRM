# CRM-F1-10 — Contrato, projeto e recebível gerados automaticamente

Status: Done (implementado 2026-08-04) — fecha o gate da Fase 1 do plano mestre

## Objetivo

Fazer o cliente percorrer lead → briefing → proposta → aceite → contrato → projeto → recebível **sem intervenção manual da equipe entre cada etapa** (gate explícito da Fase 1 em `docs/PLANO_MESTRE_EVOLUCAO_CRM.md` §7).

## Contexto confirmado

Contrato, projeto e recebível já podiam ser gerados a partir de proposta/contrato — mas cada um exigia um clique manual da equipe em 3 momentos separados (`createContractFromProposal`, `createProjectFromContract`, `createReceivableFromContract`), todos gateados por permissão interna (`contracts.create`/`projects.create`/`finance.create`). Isso não satisfaz o gate do plano: o fluxo não é "sem intervenção".

## Decisão de design: os dois pontos de gatilho corretos

"No aceite" não significa literalmente "tudo no mesmo instante em que a proposta é aceita" — contrato, projeto e recebível têm uma dependência estrutural real (`createProjectFromContract`/`createReceivableFromContract` já exigiam `contract.status === "signed"`, uma checagem pré-existente, correta e não alterada por esta story). Projeto/recebível **não podem** existir antes da assinatura do contrato, que é um evento distinto e necessariamente posterior. Os dois pontos de gatilho automático corretos são:

1. **Aceite da proposta** (`approveProposal`) → gera o **contrato** (rascunho).
2. **Assinatura do contrato** (`signContractPublic`) → gera **projeto** e **recebível** (ambos dependem só do contrato assinado, não um do outro).

## Escopo

- Extraído o núcleo de cada uma das 3 actions existentes (sem `requirePermission`, `actorUserId`/`ownerUserId` nullable), reaproveitado tanto pela action manual autenticada quanto pelo gatilho automático:
  - `contracts.ts`: `createContractForApprovedProposal` → `createContractFromProposal` (manual) e `tryAutoGenerateContract` (automático).
  - `projects.ts`: `createProjectForSignedContract` → `createProjectFromContract` (manual) e `tryAutoGenerateProject` (automático).
  - `finance.ts`: `createReceivableForSignedContract` → `createReceivableFromContract` (manual) e `tryAutoGenerateReceivable` (automático, com parcela única padrão — ver "Riscos").
- `approveProposal` chama `tryAutoGenerateContract` depois de commitar sua própria transação.
- `signContractPublic` chama `tryAutoGenerateProject` (dono = responsável da oportunidade) e `tryAutoGenerateReceivable` (valor = total da proposta vinculada, vencimento em 30 dias) depois de commitar sua própria transação.
- As 3 funções `tryAutoGenerate*` **nunca lançam** — uma falha na geração automática é logada (estruturado, `CRM-F0-09`) e segue; o cliente já viu a confirmação de aceite/assinatura antes desse ponto, e a equipe sempre pode gerar manualmente pelos botões já existentes (que agora simplesmente não fazem nada se o registro automático já existir — `createContractFromProposal`/`createProjectFromContract`/`createReceivableFromContract` continuam funcionando exatamente como antes pra esse caso).

## Fora de escopo

- Plano de parcelamento inteligente no recebível automático — usa parcela única com o valor total, vencimento em 30 dias (não há ninguém definindo um plano no momento da assinatura pública). A equipe ajusta manualmente se precisar de parcelamento real (o registro já existe pra isso, mesmo caminho de qualquer correção financeira).
- Aviso/notificação especial de "gerado automaticamente" na UI interna — as telas de contrato/projeto/financeiro mostram os registros normalmente, sem uma tag distinguindo origem manual vs. automática.

## Critérios de aceite verificáveis

- Aceitar uma proposta gera um contrato rascunho automaticamente, sem clique manual.
- Assinar o contrato gera projeto (com checklist padrão) e recebível (parcela única, 30 dias) automaticamente, sem clique manual.
- Se contrato/projeto/recebível já existir (gerado manualmente antes), a geração automática não duplica nem lança erro — só não faz nada.
- Uma falha na geração automática não impede a resposta de sucesso do aceite/assinatura ao cliente.
- As actions manuais (`createContractFromProposal` etc.) continuam funcionando exatamente como antes para quem ainda preferir clicar.
- Tipos, testes e build passam.

## Regras de autorização

Nenhuma nova. As 3 funções `tryAutoGenerate*` não chamam `requirePermission()` de propósito — são invocadas só internamente, a partir de actions públicas por token já validadas (mesmo padrão de `getPublicFilesForEntity`).

## Alterações de banco

Nenhuma.

## Riscos

- Recebível automático com parcela única (não parcelado) pode não refletir a condição de pagamento real acordada na proposta (`proposal_payment_options` tem entrada + parcelas, mas sincronizar isso com o recebível exigiria mais lógica) — aceito como default razoável, ajustável manualmente. Registrado, não escondido.
- `tryAutoGenerateReceivable` usa `proposal.total`, que (por decisão de `CRM-F1-06`) não inclui itens opcionais aceitos — o recebível automático reflete o total base, não o total com opcionais. Ajuste manual necessário quando houver opcionais aceitos; fora do escopo resolver isso automaticamente aqui.

## Dev Agent Record

### File List

- `src/server/actions/contracts.ts` — `createContractForApprovedProposal`, `tryAutoGenerateContract`.
- `src/server/actions/projects.ts` — `createProjectForSignedContract`, `tryAutoGenerateProject`.
- `src/server/actions/finance.ts` — `createReceivableForSignedContract`, `tryAutoGenerateReceivable`.
- `src/server/actions/public-quote.ts` — chama `tryAutoGenerateContract` após o aceite.
- `src/server/actions/contracts.ts::signContractPublic` — chama `tryAutoGenerateProject`/`tryAutoGenerateReceivable` após a assinatura.

### Completion Notes

- `tsc --noEmit`: limpo. `vitest run`: 106/106 (inalterado — refatoração de orquestração, sem schema/validação nova). `next build`: verde, 32 rotas (sem rota nova, sem erro de import circular). `biome lint`: 0 erros. `npx playwright test`: 6/6.
- Verificado que não há import circular real entre `contracts.ts`↔`projects.ts`↔`finance.ts` (todos importam só as tabelas de schema um do outro, não as actions) — confirmado por `tsc`/`next build` limpos, não só por leitura.
- **Não validado com dado real**: mesma limitação de toda a sessão — não foi possível confirmar o encadeamento completo (aceite → contrato → assinatura → projeto + recebível) contra um banco de verdade.

## Fechamento da Fase 1

Com esta story, as 7 stories pedidas pelo responsável nesta sessão (F1-02 a F1-08, F1-10) estão concluídas, além de F1-01 (sessão anterior a esse pedido) e F1-03/F1-09 confirmadas já implementadas por auditoria. O gate da Fase 1 do plano mestre — "um cliente percorre lead → briefing → proposta → aceite → contrato → projeto → recebível sem intervenção no banco" — está tecnicamente satisfeito no código; falta validação com dado real (organização/usuário de teste, banco disponível), débito recorrente de toda a sessão.