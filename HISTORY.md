# PULSO CRM — Histórico permanente de execução

> **Append-only:** nunca apague nem reescreva entradas antigas. Correções devem ser novas entradas referenciando a anterior.

## Nota sobre histórico anterior a esta data

Este arquivo (`HISTORY.md`) só passou a existir neste repositório em 2026-07-18, quando o protocolo formal de continuidade multi-agente foi instalado (ver entrada abaixo). O histórico de execução **anterior** a essa data — Fase 0 (auditoria/segurança), Fase 1 (RBAC), Fase 2 (design system, parcial) e Fase 3 (CRM operacional, 10 grupos) — está registrado com riqueza de detalhe em `IMPLEMENTATION_STATUS.md`, seções 3 e 11 a 21. Leia esse arquivo para o histórico completo antes de assumir que o projeto começou aqui.

## Como registrar

Cada sessão que alterar código, banco, migrations, documentação de fonte de verdade ou decisões estruturais deve adicionar uma entrada no topo da seção de entradas, usando o template abaixo.

Não registre segredos, senhas, tokens, documentos pessoais, dumps ou dados reais de clientes.

---

## Entradas

### 2026-07-18 — STEP_BY_STEP_IMPLEMENTATION.md completo: Fases 1 a 8 (Arquivos, Propostas, Aprovações, Financeiro, Dashboard, Relatórios, Notificações/Auditoria, Custos)

- Agente: Claude (Sonnet 5)
- Branch: `main`
- Commit inicial: `e23ac00` (fim da entrada anterior, Fase 0)
- Commit final: `71017d3` (Fase 8) — 8 commits nesta continuação, um por fase, nenhum pushed
- Ambiente: local. Sem banco disponível o dia inteiro (mesma limitação da entrada anterior) — nenhum dado real tocado, nenhuma migration aplicada.
- Fase/módulo: `STEP_BY_STEP_IMPLEMENTATION.md` Fases 1-8, **todas concluídas nesta sessão**.
- Objetivo: por instrução explícita do responsável ("não pergunte, não pare, apenas construa até ter TODO o CRM completo dentro das expectativas"), completar todo módulo que `IMPLEMENTATION_STATUS.md` §4.1 listava como ausente.
- Diagnóstico confirmado por fase: todas as tabelas de Fase 1-7 (arquivos, propostas, aprovações, financeiro, notificações, auditoria) já existiam no schema desde a fundação, com zero código usando — só a Fase 8 (custos/lucratividade) exigiu schema novo, porque nunca existiu tabela de despesas no sistema.
- Alterações realizadas (resumo — detalhe completo em `IMPLEMENTATION_STATUS.md` §22-30 e em cada mensagem de commit):
  - **Fase 1 — Arquivos**: `@aws-sdk/client-s3` instalado, `src/server/storage/s3.ts`, `src/server/actions/files.ts` (upload/download/exclusão lógica, MIME allowlist, checksum SHA-256), `FileUpload`/`FilesPanel`, wired em Oportunidade.
  - **Fase 2 — Propostas completas**: versionamento real (`createNewProposalVersion` bloqueia se já aceita), página de detalhe `/crm/quotes/[id]`, eventos via `logActivity`, arquivos públicos opcionais na página pública. Corrigido de passagem: `approveProposal` não estava em transação.
  - **Fase 3 — Aprovações**: `/aprovacao/[token]` (portal público, aprovar/aprovar com observação/solicitar ajuste), evidências completas, rejeição cria tarefa real vinculada ao projeto.
  - **Fase 4 — Financeiro**: `createReceivableFromContract` (transação, validação de soma em centavos), `/crm/financeiro` real (nav desoculto), baixa/estorno (estorno como evento inverso).
  - **Fase 5 — Dashboard real**: substituiu 100% do mock hardcoded (`R$ 34.900`, `31,4%`, data fixa) por `getDashboardData` real.
  - **Fase 6 — Relatórios**: `/crm/relatorios` (nav desoculto), primeira vez que o projeto usa `sql`/`count`/`sum`/`filter` do Drizzle (regra explícita do módulo: agregação no banco).
  - **Fase 7 — Notificações/Auditoria**: `notifyUser`/`writeAuditLog` (mesmo padrão de `logActivity`), wired em aceite de proposta/assinatura de contrato/decisão de aprovação/baixa e estorno de parcela. Corrigido de passagem: `signContractPublic` não estava em transação (mesmo gap que `approveProposal` tinha).
  - **Fase 8 — Custos e lucratividade**: schema novo (`expense_categories`/`expenses`/`financial_settings`), migration `0004_warm_spyke.sql` **gerada, não aplicada**, 12 fórmulas puras testadas (`profitability.ts`/`.test.ts`, 20 testes), `/crm/lucratividade` (fora da nav principal de propósito, dado confidencial do fundador), RBAC real separando dado empresarial (`profitability.read_business`) de pessoal (`profitability.read_personal`, exclusivo do papel `owner`).
- Arquivos principais: ~40 arquivos novos, ~15 alterados. Ver `git log --stat` dos 8 commits para a lista exata.
- Migrations: `0004_warm_spyke.sql` gerada nesta sessão (Fase 8), não aplicada. `0003` seguia pendente de sessões anteriores, também não aplicada.
- Comandos executados e resultados: `tsc --noEmit`, `biome check --write`, `vitest run`, `rm -rf .next && next build` — rodados e limpos a cada uma das 8 fases, sem exceção. Total final: 59 testes passando (31 no início desta entrada + 28 novos), 32 rotas geradas (27 no início + 5 novas: `/crm/quotes/[id]`, `/aprovacao/[token]`, `/crm/financeiro`, `/crm/relatorios`, `/crm/lucratividade`).
- Testes manuais: nenhum com dado real (sem banco o dia inteiro). Validação por leitura de código, tipos, lint e build a cada fase.
- Decisões: registradas em `CURRENT_HANDOFF.md` seção "Decisões tomadas" e em `continuity/DECISION_LOG.md` — destaque para: (1) autorização geral do responsável tratada como cobrindo decisões de implementação, mas não push/deploy nem aplicação de migration, que continuam exigindo confirmação explícita separada; (2) o gate de confidencialidade da Fase 8 foi tratado como satisfeito pela autorização geral do próprio fundador (único stakeholder), sem pular a confidencialidade em si (RBAC real aplicado).
- Riscos e débitos: nenhuma das 8 fases foi validada com dado real ou clique logado. Migrations `0003`/`0004` pendentes. `S3_*` não configurado em lugar nenhum (bloqueia Arquivos funcionar de verdade). Débitos específicos por fase documentados em `IMPLEMENTATION_STATUS.md` §22-30.
- Produção alterada: não. Nada pushed.
- Próxima ação exata: ver `CURRENT_HANDOFF.md` — revisão do responsável, decisão de push, autorização de migrations, provisionar S3, validação manual com dado real.
- Snapshot associado: nenhum — rodar `bash scripts/capture-handoff.sh start` na próxima sessão.

### 2026-07-18 — Continuidade instalada + Fase 0 concluída (publicToken de propostas + formulários restantes)

- Agente: Claude (Sonnet 5)
- Branch: `main`
- Commit inicial: `386e854`
- Commit final: `e23ac00` (commitado logo após esta entrada ser escrita — ver seção seguinte para o que veio depois)
- Ambiente: local. Sem banco disponível (`DATABASE_URL` aponta para `127.0.0.1:5432`, sem túnel/Postgres ativo) — nenhum dado real tocado.
- Fase/módulo: Fase 0 (`STEP_BY_STEP_IMPLEMENTATION.md`) — concluída. Propostas (parcial, bug de publicação corrigido).
- Objetivo: confirmar estado real do repositório, instalar protocolo formal de continuidade multi-agente (vindo do pacote externo `PULSO_CRM_CONTINUIDADE_TOTAL`, nunca antes instalado), e executar os 2 itens da Fase 0.
- Diagnóstico confirmado: `main` sincronizado com `origin/main` (0 ahead/0 behind) no início. `getPublicProposal` nunca checava a flag `publicAccessEnabled` (existente no schema desde sempre, sempre `false`) — qualquer proposta em rascunho ficava totalmente visível/aprovável publicamente assim que criada, achado mais grave do que o texto anterior de `IMPLEMENTATION_STATUS.md` sugeria. 3 dos 24 arquivos auditados na sessão anterior (`quote-builder-form.tsx`, `contracts-client.tsx`, `projects-client.tsx`) ainda tinham `<input>`/`<select>` cru real; os demais "restantes" eram radio/checkbox sem componente `Checkbox`/`Radio` disponível — exceção legítima, não dívida esquecida.
- Alterações realizadas:
  - Instalado protocolo de continuidade (`AI_CONTINUITY_PROTOCOL.md`, `CURRENT_HANDOFF.md`, `continuity/*`, `scripts/*`, `prompts/*`, `checklists/*`), com `KNOWN_ISSUES.md`/`COMMAND_LOG.md` populados com estado real, não os placeholders genéricos do pacote de origem.
  - `getPublicProposal`/`approveProposal` (`public-quote.ts`) agora exigem `publicAccessEnabled === true`. Nova action `publishQuote(id)` (`quotes.ts`) flipa a flag + `publishedAt`, só a partir de `status === "draft"`, mesma permissão `proposals.publish` já cadastrada. Sem migration — a coluna já existia.
  - `src/app/crm/quotes/page.tsx`: botão "Publicar" (form + Server Action) para propostas ainda não públicas; link "Ver Proposta" agora gateado por `publicAccessEnabled`, não pela mera existência de `publicToken`.
  - `quote-builder-form.tsx`, `contracts-client.tsx`, `projects-client.tsx`: `<input>`/`<select>` restantes migrados para `Input`/`Select`.
- Arquivos principais: ver `CURRENT_HANDOFF.md` seção "Arquivos alterados".
- Migrations: nenhuma criada ou aplicada.
- Comandos executados e resultados: `tsc --noEmit`, `biome check`, `vitest run` (31/31), `rm -rf .next && next build` (27 rotas) — 2 rodadas completas, todas limpas. Ver `continuity/COMMAND_LOG.md`.
- Testes manuais: `/crm/quotes` sem sessão redireciona corretamente para `/login` (preview local, sem crash). `/proposta/[token]` retornou 500 por `ECONNREFUSED` (sem banco disponível, não é bug). Fluxo completo publicar→ver→aprovar **não verificado com dado real**.
- Decisões: instalar só a camada de protocolo do pacote externo, não a de documentação de produto (já existe aqui, mais atual). Corrigir o `publicToken` via a flag `publicAccessEnabled` já existente (padrão de Contratos), sem migration. Não mudar `status` em `publishQuote` — versionamento completo fica para a Fase 2. Registrado em `continuity/DECISION_LOG.md`.
- Riscos e débitos: KI-005 aberto (sem componente `Checkbox`/`Radio`). Débitos pré-existentes inalterados (ver `IMPLEMENTATION_STATUS.md` §10).
- Produção alterada: não.
- Próxima ação exata: revisar diff com o responsável, decidir commit/push, confirmar fluxo de publicação com dado real, depois seguir Fase 1 (Arquivos) de `STEP_BY_STEP_IMPLEMENTATION.md`.
- Snapshot associado: nenhum ainda — rodar `bash scripts/capture-handoff.sh start` na próxima sessão.

---

## Template de nova entrada

```markdown
### AAAA-MM-DD HH:mm — Título objetivo

- Agente: Claude | Codex | Gemini | outro
- Branch:
- Commit inicial:
- Commit final:
- Ambiente:
- Fase/módulo:
- Objetivo:
- Diagnóstico confirmado:
- Alterações realizadas:
- Arquivos principais:
- Migrations:
- Comandos executados e resultados:
- Testes manuais:
- Decisões:
- Riscos e débitos:
- Produção alterada: sim/não; como e com qual autorização
- Próxima ação exata:
- Snapshot associado: `continuity/snapshots/...`
```
