# IMPLEMENTATION_STATUS — PULSO CRM

> Fonte de verdade do estado atual da implementação.
>
> Data-base inicial: 17/07/2026
> Atualizar ao final de cada fase ou alteração relevante.

## 1. Identificação

- Produto: PULSO CRM
- Uso: interno e exclusivo da PULSO
- Ambiente de produção: `crm.pulsosh.cloud`
- Fuso: `America/Fortaleza`
- Moeda: BRL
- Workspace operacional: PULSO
- Modelo comercial do CRM: nenhum; não é SaaS

## 2. Estado de produção conhecido

- `/login`: respondeu 200 em 17/07/2026.
- `/api/health`: respondeu 200 em 17/07/2026.
- Autenticação: funcional.
- Banco: praticamente vazio.
- Organizações: 1.
- Usuários: 1 administrador.
- Funis: 1.
- Produtos: 15 itens seedados.
- Empresas reais preservadas: 0.
- Contatos reais preservados: 0.
- Oportunidades reais preservadas: 0.
- Briefings reais preservados: 0.
- Propostas reais preservadas: 0.
- Contratos reais preservados: 0.
- Projetos reais preservados: 0.

## 3. Risco crítico de segurança conhecido

A senha administrativa inicial esteve em texto no `seed.ts` (`hashPassword("pulso_admin_secure")`, e impressa via `console.log`).

**Corrigido em 17/07/2026** (Fase 0): `seed.ts` agora exige `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` via ambiente (falha com erro claro se ausentes), não imprime mais a senha no console, e o seed inteiro passou a ser idempotente (organização, papel e usuário são reaproveitados se já existirem em vez de duplicar). `.env.example` documenta as três variáveis novas. Validado por `tsc --noEmit` limpo; **não executado contra produção nesta fase** (alterar dado de produção exige autorização explícita, ver `docs/runbooks/production-safety.md`).

Ainda pendente:

- rotacionar a senha administrativa já semeada em produção (o hash antigo continua válido até rotação explícita);
- confirmar que nenhum outro segredo real está em histórico de commits.

O `BETTER_AUTH_SECRET` foi ajustado via CLI (`docker service update --env-add`), mas **não está persistido na configuração salva do Dokploy** — qualquer redeploy futuro reverte para o valor fraco anterior. Confirmado neste ciclo: isso já aconteceu duas vezes na sessão de 17/07.

## 4. Estado dos módulos

| Módulo | Estado conhecido | Observação |
|---|---|---|
| Autenticação | Funcional | Better Auth e sessão real |
| Workspace PULSO | Parcial | Há organização no banco; não construir multiempresa |
| Usuários e papéis | Funcional (Fase 1) | 6 papéis (owner/admin/commercial/projects/finance/viewer), catálogo de permissões, `requirePermission()` aplicado em todas as actions internas. Falta UI de gestão de papéis/convite. |
| Contatos | Funcional básico | Falta validação robusta, normalização e duplicidade |
| Empresas | Funcional básico | Falta validação robusta, normalização e duplicidade |
| Funil e oportunidades | Funcional básico | Kanban persiste; cards e regras incompletos |
| Atividades | Parcial/ausente | Linha do tempo precisa ser consolidada |
| Tarefas e calendário | Ausente | Link de navegação conhecido como morto |
| Briefings | Existe | Precisa auditoria, teste real e validação do fluxo |
| Portal público de briefing | Existe | `/solicitar/[slug]` |
| Produtos | Funcional | 15 produtos seedados |
| Propostas | Parcial | Rascunho apresenta link público antes de publicar; link dá 404 |
| Versionamento de proposta | Ausente/incompleto | Publicação e snapshots precisam ser implementados |
| Contratos | WIP | Construído rapidamente e fora do design system |
| Projetos | WIP não validado | Ainda sem confiança de typecheck/build/teste |
| Arquivos | Ausente | Implementar storage privado |
| Aprovações | Ausente | Implementar portal público e evidências |
| Financeiro | Ausente | Recebíveis, parcelas e baixas |
| Custos e lucratividade | Ausente | Confidencial e restrito ao fundador |
| Dashboard de atenção | Ausente/incompleto | Deve responder o que exige ação hoje |
| Relatórios | Ausente | Comercial, operação, financeiro e sustentabilidade |
| Notificações | Ausente | Internas primeiro |
| Auditoria | Ausente/incompleta | Obrigatória em ações críticas |
| IA | Fora da prioridade | Deve permanecer desligada |

## 5. Working tree em 17/07/2026 (pós Fase 0)

Branch `main`, sincronizado com `origin/main`, HEAD em `12c32fa`.

```text
M  src/app/globals.css                          → bloco @theme (ponte Tailwind), build verificado verde
M  src/components/crm/app-shell.tsx              → href de Contratos/Orçamentos corrigido, nav Operação habilitada
M  src/server/db/migrations/meta/_journal.json   → registra migration 0002
M  src/server/db/schema/projects.ts              → +contractId (uuid, FK contracts.id, nullable, set null)
M  src/server/db/seed.ts                         → seed seguro e idempotente (ver seção 3)
M  .env.example                                  → +SEED_ADMIN_NAME/EMAIL/PASSWORD
?? src/app/crm/projetos/*                        → módulo Projetos (schema+action ok, tela não usa tokens Pulso)
?? src/components/crm/project-details-client.tsx
?? src/components/crm/projects-client.tsx
?? src/server/actions/projects.ts
?? src/server/db/migrations/0002_safe_exiles.sql → JÁ APLICADA EM PRODUÇÃO (ver seção 8)
?? CLAUDE.md, IMPLEMENTATION_STATUS.md, CHANGELOG.md, docs/* → pacote de execução copiado para a raiz
```

Nada foi apagado ou recriado. Nenhum dado de produção foi alterado nesta fase, exceto a aplicação da migration `0002` (já relatada como feita antes desta auditoria, confirmada abaixo).

## 6. Débitos conhecidos (confirmados nesta auditoria)

- ~~RBAC ausente~~ **Corrigido na Fase 1** — ver seção 11.
- ~~Nenhuma server action valida sessão ou papel internamente~~ **Corrigido na Fase 1** — ver seção 11.
- **Rotas antigas com mock coexistem com rotas reais**: `/crm` (usa `components/crm/kanban-board.tsx` + `src/data/opportunities.ts`) e `/briefings` (usa `components/briefings/briefing-inbox.tsx` + dado mockado) continuam no ar ao lado de `/crm/pipeline` e `/crm/briefings/inbox`, que são as versões reais.
- **Nav com links mortos**: `Tarefas`, `Financeiro`, `Relatórios` e `Configurações` continuam sem página real (agora ocultos do menu em vez de aparecer como link morto - `app-shell.tsx` filtra `href === "#"`).
- **Design system não funciona na base** (achado e parcialmente corrigido nesta sessão): `components/ui/*` (Button, Card, Badge, Modal, Input, Select, Textarea) usa classes Tailwind (`bg-pulso-signal`, `rounded-card`, `duration-base`...) que nunca foram registradas via `@theme`. Corrigido agora (`globals.css`), mas **zero arquivos no projeto importam esses componentes** — cada tela usa Tailwind cru independente. 8 arquivos usam classes arbitrárias em colchetes (`shadow-[...]` etc).
- **Link público de proposta aparece antes do estado correto**: `publicToken` é gravado na criação da proposta (antes de qualquer publicação), então a lista de orçamentos já mostra "Ver Proposta" para rascunhos, que dá 404 na página pública — comportamento correto do lado da página pública (não vaza rascunho), mas a UI interna induz ao erro.
- **Contratos e projetos foram acelerados sem gate de qualidade**: ambos compilam e passam nos testes existentes, mas foram construídos com Tailwind cru (não os tokens Pulso) e sem teste de aceite formal. Autorização agora aplicada (Fase 1), mas a interface continua fora do design system.
- Ausência de testes significativos (2 testes triviais, inalterado — `requirePermission()` e o mapeamento de papéis ainda não têm teste automatizado, só validação manual).
- Financeiro, tarefas, arquivos, aprovações e relatórios: ausentes.
- `docs/ARCHITECTURE_AND_STANDARDS.md` seção 6 não lista permissões de `briefings.*` — adicionadas por extensão consistente (`briefings.read/manage_templates/review`) em `src/server/auth/permission-keys.ts`, já que o módulo existe e precisa de autorização. Revisar se a divisão faz sentido.

## 7. Checks (executados nesta auditoria, 17/07/2026)

- Instalação: já realizada em sessão anterior (`node_modules` presente, `pnpm`); não reinstalado nesta rodada.
- Lint (`biome check .`): **43 erros, 6 warnings, 1 info.** Nenhum é bloqueante de build. Predominam `lint/a11y/noLabelWithoutControl` (16 ocorrências em `contacts-client.tsx`, `companies-client.tsx`, `kanban-board.tsx`), `lint/a11y/useButtonType` (4), `lint/suspicious/noExplicitAny` (4), e o resto são `organizeImports`/`noUnusedImports` auto-corrigíveis.
- Typecheck (`tsc --noEmit`): **limpo, 0 erros** (incluindo o módulo Projetos em WIP e o fix do seed).
- Testes (`vitest run`): **2 arquivos, 2 testes, todos passando.**
- Build (`next build`): **verde**, 30 rotas geradas, incluindo `/contrato/[token]`, `/crm/contratos`, `/crm/contratos/[id]`, `/crm/projetos`, `/crm/projetos/[id]`.
- E2E (`playwright`): não configurado no projeto; script não existe.

## 8. Migrações

- Tabela `drizzle.__drizzle_migrations` em produção tem exatamente 3 linhas, correspondendo 1:1 aos 3 arquivos locais (`0000_melted_silver_samurai.sql`, `0001_sticky_spot.sql`, `0002_safe_exiles.sql`).
- `0002` (adiciona `projects.contract_id`, nullable, FK `set null`) confirmada aplicada em produção em 17/07 17:31 UTC.
- Verificação de integridade: 0 referências órfãs entre `projects.contract_id` e `contracts.id`.
- Backup pré-migration: **não confirmado formalmente** — a migration já havia sido aplicada antes desta auditoria começar; não há evidência de backup prévio registrado.

## 9. Fase atual

**Fase 1 concluída nesta sessão** (workspace interno, usuários, RBAC e autorização).

## 10. Próxima ação exata

Iniciar Fase 2 (`docs/ROADMAP.md`): auditar e corrigir o design system de verdade — migrar o shell e os formulários principais para os componentes de `components/ui/*` (agora que o `@theme` funciona), remover/isolar `/crm` e `/briefings` (rotas mockadas antigas), decidir o que fazer com os links de nav ocultos (Tarefas/Financeiro/Relatórios/Configurações). Rodar `npm run check` a cada mudança pequena, sem refatoração visual total em um único commit (regra explícita de `docs/DESIGN_SYSTEM.md` seção 6).

Pendências que seguem precisando de autorização explícita do responsável antes de agir:
- rotacionar a senha administrativa já semeada em produção;
- persistir `BETTER_AUTH_SECRET` forte na configuração salva do Dokploy (hoje só existe via `docker service update`, some no próximo redeploy).

## 11. Fase 1 — Workspace, usuários, RBAC e autorização (concluída 17/07/2026)

### O que foi feito

- **Catálogo de permissões tipado**: `src/server/auth/permission-keys.ts` — todas as chaves de `docs/ARCHITECTURE_AND_STANDARDS.md` seção 6, mais `briefings.read/manage_templates/review` (extensão necessária, o doc não cobria o módulo de briefings). 6 papéis: `owner` (tudo), `admin` (tudo exceto `profitability.*_personal`/`view_founder_summary`), `commercial`, `projects`, `finance`, `viewer` (só leitura).
- **Helper central**: `src/server/auth/require-permission.ts::requirePermission(key)` — resolve sessão real via Better Auth, busca o vínculo ativo (`organization_members` com `status = "active"`), resolve o papel, confere a permissão via join `role_permissions` × `permissions` no banco (não um mapa hardcoded em memória), nega por padrão. Retorna `{ userId, organizationId, memberId, roleKey }` — **nunca confia em `organizationId` vindo do cliente**.
- **Seed de papéis/permissões**: `src/server/db/seed-permissions.ts::seedPermissionsAndRoles()` — idempotente, migra o antigo papel `super_admin` para `owner` em vez de duplicar (o membro existente continua com o mesmo `role_id`, só o `key`/`name` mudam). **Executado contra produção** nesta sessão (autorizado pelo responsável ao dizer "segue da melhor forma" após eu confirmar que Fase 1 não altera dados de produção além de RBAC aditivo): 69 permissões e 6 papéis criados, papel do admin migrado para `owner` com sucesso, confirmado idempotente (segunda execução não duplicou nada).
- **Todas as server actions internas agora chamam `requirePermission()` e usam o `organizationId`/`userId` retornado, não mais um parâmetro recebido**: `pipeline.ts`, `companies.ts`, `contacts.ts`, `products.ts`, `quotes.ts`, `briefing-templates.ts`, `briefing-submissions.ts`, `contracts.ts` (exceto `getPublicContract`/`signContractPublic`, que são públicas por token e continuam sem sessão, como deve ser), `projects.ts`. Todas as páginas e client components que chamavam essas actions foram atualizadas para não enviar mais `organizationId`/`userId`.
- **Bugs de isolamento corrigidos no caminho**: `products/[id]/page.tsx` fazia `db.update` direto na página sem filtro de organização (nova action `updateProduct` corrige isso); `toggleChecklistItem` em projetos não verificava organização nenhuma antes de atualizar um item de checklist por ID.

### Validação real (não só "compilou")

- `tsc --noEmit`, `vitest run` (2/2) e `next build` (30 rotas) verdes.
- **Testado manualmente de ponta a ponta** com servidor local (`next dev`) apontado para o banco de produção via túnel SSH, logado como `admin@pulso.cloud`: `/crm/pipeline` (leitura + criar oportunidade via `createOpportunity` — log do servidor confirma a chamada usando `organizationId` resolvido da sessão, não de parâmetro), `/crm/contatos`, `/crm/empresas`, `/crm/quotes`, `/crm/contratos`, `/crm/projetos` — todas renderizam e funcionam.
- Dado de teste criado durante a validação (`"Teste Autorizacao Fase1"`) removido do banco depois.

### Débitos que ficam para depois

- Sem UI de gestão de papéis/convite de membros ainda (papéis existem no banco, mas só via seed).
- Sem teste automatizado do `requirePermission` (só validação manual via navegador).
- Mapeamento papel→permissão é uma primeira tentativa baseada nas descrições de `docs/PRODUCT_VISION.md` seção 4 — não validado com uso real ainda (ex.: se `commercial` deveria poder `contracts.cancel`).
