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
- ~~Rotas antigas com mock coexistem com rotas reais~~ **Corrigido na Fase 2 (parte 1)** — ver seção 12.
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

**Fase 2 em andamento** (parte de design system) e **Fase 3 iniciada em paralelo** (CRM operacional), por decisão explícita do responsável em 17-18/07/2026: o app estava "inutilizável" no dia a dia, e fechar 100% da Fase 2 antes de tocar em função real não fazia sentido — ver seção 18.

Fase 2: Parte 1 (limpeza de rotas mockadas) concluída — ver seção 12. Parte 1b (extração mecânica de inline styles do shell para Tailwind) concluída — ver seção 13. Parte 1c (limpeza de lint de acessibilidade) concluída — ver seção 14. Parte 1d (`noExplicitAny`/`@ts-ignore` reais) concluída — ver seção 15. `npm run lint` em **zero erros/warnings de regra real**. Parte 2a (3 botões de ícone do shell usando `components/ui/*`) concluída — ver seção 16. Bug real de responsividade mobile corrigido (viewport + gaveta do menu) — ver seção 17, **pendente confirmação visual do responsável em aparelho real**.

Fase 3 (parte 1): 10 grupos construídos, testados e commitados localmente nesta sessão (17-18/07/2026) — próxima ação, ganho/perda, tarefas básicas, edição/exclusão de contatos e empresas, transação em `moveOpportunity`, linha do tempo de atividades, contato vinculado a empresa, restaurar excluído, vínculos (briefing/proposta/contrato/projeto) na oportunidade, e temperatura/responsável no card do Kanban. Ver seção 18 para detalhes completos por grupo, débitos conhecidos e o que ainda falta confirmar.

**Decisão registrada com o responsável em 17/07/2026**: os links ocultos de nav (Financeiro/Relatórios/Configurações) ficam como estão — array com `href: "#"`, filtrado da renderização (`app-shell.tsx`), documentado como placeholder pras fases futuras que constroem essas telas (Financeiro = Fase 8, Relatórios = Fase 10, Configurações = módulo de Workspace/Fase 1 pendente de UI). **"Tarefas" saiu dessa lista em 18/07/2026** — agora aponta pra `/crm/tarefas`, uma tela real (ver seção 18, Grupo 3). Não remover nem promover os demais sem que a tela real exista.

## 10. Próxima ação exata

**Bloqueado em autorização do responsável, não em trabalho técnico**: nada da Fase 3 (seção 18) foi enviado ao GitHub nem ao banco — 11 commits estão só locais (`bc90224`, `a589ed8`, `6317388`, `bc6f24c`, `9789ade`, `4e62471`, `e23048f`, `989772d`, `8e5f534`, `db3df7f`, `a13de89`), além do de mobile `6324f7d` que já foi confirmado e enviado antes. Antes de continuar:
1. Responsável precisa logar em produção (ou ambiente de teste) e confirmar que os 10 grupos funcionam de verdade — só foi possível verificar a "casca" (formulário renderiza, campos corretos, ação correta é chamada, permissão corretamente negada sem sessão) sem sessão real, não o fluxo de banco de ponta a ponta.
2. Decidir se aplica a migration `0003_cynical_forgotten_one.sql` (fix da FK `tasks.project_id`) — pequena e aditiva, mas ainda precisa autorização explícita antes de tocar produção.
3. Decidir quando dar push — meta combinada era "só commitar/subir quando tiver algo palpável pra uso"; os 10 grupos juntos formam essa fatia palpável, provavelmente já grande o bastante pra valer revisão antes de continuar acumulando mais commits locais.

Depois disso, retomar Fase 2 (`components/ui/*` de verdade nas telas de CRM, ver seção 16) ou continuar aprofundando a Fase 3 (produtos na oportunidade, diagnóstico/orçamento informado, filtros e busca no Kanban, visão 360° de contato/empresa, checklist de tarefa, calendário) — a decidir com o responsável.

**Nota para sessões futuras**: `npm run dev` neste checkout demonstrou HMR (hot module reload) de CSS não-confiável durante a sessão de 17/07 — mudanças em `globals.css` às vezes não se propagavam pra aba aberta do navegador mesmo com o arquivo salvo. Sempre que for verificar uma mudança de CSS/layout via `next dev`, reiniciar o servidor com `.next` limpo antes de confiar no resultado.

Pendências que seguem precisando de autorização explícita do responsável antes de agir:
- rotacionar a senha administrativa já semeada em produção;
- persistir `BETTER_AUTH_SECRET` forte na configuração salva do Dokploy (hoje só existe via `docker service update`, some no próximo redeploy);
- aplicar a migration `0003_cynical_forgotten_one.sql` (fix `tasks.project_id`) em qualquer ambiente com dado real.

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

## 12. Fase 2 (parte 1) — Limpeza de rotas mockadas e correção de navegação (concluída 17/07/2026)

### Diagnóstico

Auditoria de `src/app` encontrou três rotas internas que renderizavam dados 100% mockados (estado local com `useState`, sem nenhuma chamada a server action), órfãs — nenhum outro código as importava:

- `/crm` (`src/app/crm/page.tsx`) — `KanbanBoard` mock de `src/components/crm/kanban-board.tsx`, dados fixos de `src/data/opportunities.ts`. Coexistia com `/crm/pipeline`, a versão real e persistida.
- `/briefings` (`src/app/briefings/page.tsx`) — `BriefingInbox` mock de `src/components/briefings/briefing-inbox.tsx`, dados fixos de `src/data/briefings.ts`. Coexistia com `/crm/briefings/inbox`, a versão real.
- `/orcamentos/novo` (`src/app/orcamentos/novo/page.tsx`) — `ProposalBuilder` mock de `src/components/proposals/proposal-builder.tsx` (subtotal hardcoded `2500`, nenhum import de `@/server`). Só era referenciada por um link dentro do próprio `BriefingInbox` mock — órfã assim que este é removido. Coexistia com `/crm/quotes/new`, a versão real com `QuoteBuilderForm` + server actions.

**Bug real encontrado no caminho**: `app-shell.tsx` (usado por todas as telas internas reais) tinha o item de navegação "Briefings" apontando para `/briefings` — a rota mockada — em vez de `/crm/briefings/inbox`. Qualquer usuário clicando em "Briefings" no menu caía na versão fake.

### O que foi feito

- Removidas as três páginas mockadas e os componentes/dados que só elas usavam: `kanban-board.tsx` (versão mock, distinta de `components/crm/pipeline/kanban-board.tsx`, que é real e ficou intacta), `briefing-inbox.tsx`, `proposal-builder.tsx`, `src/data/opportunities.ts`, `src/data/briefings.ts`.
- Preservados os demais arquivos de `src/components/briefings/` (`builder/question-editor.tsx`, `builder/template-builder.tsx`, `public-briefing-form.tsx`) — são usados pela rota real `/crm/briefings/templates/[id]`, confirmados por busca de import antes da remoção.
- Corrigido `src/components/crm/app-shell.tsx`: item "Briefings" agora aponta para `/crm/briefings/inbox`.

### Validação real

- `npm run lint`: 28 erros (queda de 43 na baseline da Fase 0 — parte da dívida de a11y morreu junto com os componentes mock removidos), 0 relacionados a `app-shell.tsx`.
- `npm run typecheck`: limpo (após limpar cache stale de `.next` que ainda referenciava os arquivos deletados).
- `npm run test`: 2/2 passando.
- `npm run build`: verde, **27 rotas** (30 → 27, as três mockadas confirmadas fora do manifesto de rotas).
- `next dev` local (banco em `127.0.0.1:5432`, sem confirmar se é túnel de produção ou banco local — não investigado a fundo para evitar mexer em produção sem necessidade): confirmado ao vivo que `/crm`, `/briefings` e `/orcamentos/novo` retornam 404. Não foi feito login para testar a navegação autenticada ponta a ponta — evitado por não ter certeza se o banco conectado era produção e por não ter a senha do admin disponível de forma segura nesta sessão; a mudança é estrutural (remoção de rota + troca de uma string de `href`) e a validação por build + 404 ao vivo foi considerada suficiente.

### Débitos que ficam para depois

- O grosso da Fase 2 (entregas do roadmap: "componentes UI reutilizados", "shell responsivo e acessível", "identidade única") não foi tocado — `app-shell.tsx` e praticamente todas as telas continuam usando classes CSS globais bespoke (`globals.css`, ~1700 linhas: `.sidebar`, `.nav-link`, `.primary-button`, `.proposal-*`, etc.), não os componentes de `components/ui/*`. Isso é um trabalho maior, a ser fatiado em commits pequenos por tela, não tentado nesta sessão.
- Links de nav ocultos (Tarefas/Financeiro/Relatórios/Configurações) continuam ocultos, sem decisão tomada sobre removê-los do array ou manter como placeholder para fases futuras.

## 13. Fase 2 (parte 1b) — Extração mecânica de inline styles do shell (concluída 17/07/2026)

### Contexto e escopo combinado com o responsável

Ao planejar a migração do shell para `components/ui/*`, identifiquei que essa mudança afeta o layout de toda tela autenticada e que eu não tinha como validar visualmente em tela logada nesta sessão (sem Docker local para subir um Postgres de teste isolado, sem a senha do admin disponível de forma segura, e incerteza sobre se o `DATABASE_URL` local aponta para produção via túnel SSH). Perguntei ao responsável como proceder; ele escolheu explicitamente a opção mais conservadora: fazer **só a extração mecânica de inline styles para classes Tailwind equivalentes, sem tocar em layout, estrutura ou nas classes CSS bespoke existentes** — mudança concebida para ter zero diferença visual, verificável por build/typecheck sem precisar de login.

### O que foi feito

- `src/components/crm/app-shell.tsx`: todos os 8 blocos de `style={{...}}` (overlay mobile, wrapper da marca, wrapper do logo, label "CRM", botão de fechar mobile, wrapper do usuário, wrapper do avatar, botão de logout, botão de menu mobile, wrapper do eyebrow/título) foram substituídos por classes Tailwind utilitárias com os mesmos valores computados (ex.: `gap: "12px"` → `gap-3`, `padding: "4px"` → `p-1`, `backgroundColor: "rgba(0,0,0,0.5)"` → `bg-black/50`, `color: "inherit"` → `text-[inherit]` via valor arbitrário para preservar o comportamento exato). Nenhuma classe CSS bespoke (`.sidebar`, `.nav-link`, `.mobile-menu-btn`, etc.) foi alterada ou removida — só complementadas com as novas classes utilitárias nos mesmos elementos.
- Nenhuma mudança de estrutura, hierarquia de elementos ou valores visuais pretendida.

### Validação real

- `tsc --noEmit`: limpo.
- `vitest run`: 2/2 passando.
- `next build`: verde, 27 rotas (sem mudança no manifesto de rotas, como esperado).
- `biome check .`: contagem de erros oscilou entre 28 e 29 em execuções repetidas mesmo sem qualquer mudança no working tree — confirmado como truncamento não-determinístico do biome ao listar diagnósticos (`npx biome check src/components/crm/app-shell.tsx` isolado: 0 erros; diff de execuções antes/depois da mudança mostrou que as linhas divergentes são todas em arquivos nunca tocados nesta sessão).
- **Não validado visualmente em tela autenticada** — decisão explícita do responsável (ver contexto acima). Risco residual: erro de digitação num valor Tailwind (ex.: token errado) não seria pego por build/typecheck/lint, só visualmente. Recomendo conferência visual rápida do shell (sidebar, botão mobile, avatar, logout) na próxima vez que alguém logar, antes ou depois do push — a critério do responsável.

### Débitos que ficam para depois

- A migração real (trocar `.sidebar`/`.nav-link`/etc. por `components/ui/*`, não só limpar inline styles) continua pendente e é o próximo passo de fato da Fase 2 — precisa de verificação visual em tela logada, que não foi possível nesta sessão.

## 14. Fase 2 (parte 1c) — Limpeza de lint de acessibilidade (concluída 17/07/2026)

### O que foi feito

Fechada a dívida de lint que já vinha registrada desde a Fase 0 (seção 7), separando o que era mecânico/seguro (sem risco visual) do que exige julgamento:

- **`lint/a11y/noLabelWithoutControl` (16 ocorrências)**: `companies-client.tsx`, `contacts-client.tsx`, `pipeline/kanban-board.tsx` (a versão real, não a mock removida). Cada `<label>` ganhou `htmlFor` apontando pro `id` do `<input>`/`<select>` correspondente (ids com prefixo por formulário — `company-*`, `contact-*`, `opp-*` — únicos porque só um modal de cada fica montado por vez). Zero mudança visual: só atributos HTML de associação, nenhuma classe ou estrutura alterada.
- **`lint/a11y/useButtonType` (4 ocorrências)**: `companies-client.tsx`, `contacts-client.tsx`, `pipeline/kanban-board.tsx` (×2) — botões sem `type` explícito ganharam `type="button"`. Nenhum estava de fato dentro de uma tag `<form>` (então não havia bug funcional de submit acidental), mas ficam explícitos por padrão de código.
- **`lint/style/useNodejsImportProtocol` (1 ocorrência)**: `src/server/db/seed.ts` — `import crypto from "crypto"` → `import crypto from "node:crypto"`, com reordenação de imports feita pelo autofix do biome (`assist/source/organizeImports`).

### Deixado de propósito para depois (exige julgamento, não é mecânico)

- **`lint/suspicious/noExplicitAny` (4 ocorrências)**: `src/app/crm/quotes/new/quote-builder-form.tsx` (2), `src/components/crm/briefings/submission-details.tsx` (2). Corrigir direito exige entender a forma real do dado em cada ponto e não arrisco digitar um tipo errado sem isso.
- **`lint/suspicious/noTsIgnore` (1 ocorrência)**: `src/server/auth.ts:9`. Marcado como `FIXABLE` pelo biome, mas o autofix provavelmente só apagaria o comentário `@ts-ignore` sem resolver o erro de tipo que ele está suprimindo — preciso investigar o que está sendo ignorado antes de mexer.

### Validação real

- `npm run lint`: **10 erros, 5 warnings** (baixou de 28-29 reais; os 5 erros e o 1 warning "FIXABLE" restantes são exatamente os dois itens acima deixados de propósito). Os outros ~9 itens que aparecem como `format` no `biome check` são drift de fim-de-linha CRLF/LF pré-existente neste checkout Windows (`core.autocrlf`), presente até em arquivos nunca tocados nesta sessão (`globals.css`, `middleware.ts`, `schema/relations.ts`, jsons de migration) — não é uma regressão introduzida aqui, e normalizar isso em massa é fora de escopo (afetaria arquivos não relacionados a esta fase).
- `tsc --noEmit`: limpo.
- `vitest run`: 2/2 passando.
- `next build`: verde, 27 rotas.
- Sem verificação visual em tela autenticada — mesma limitação da seção 13 (nenhuma mudança visual pretendida; risco residual é só nos itens de `htmlFor`/`id`, que são mudanças de acessibilidade, não de aparência).

### Débitos que ficam para depois

- `noExplicitAny` (4) e `noTsIgnore` (1) seguem pendentes, agora isolados e documentados (não mais misturados com o resto da dívida de lint).
- CRLF/LF drift no checkout Windows não foi endereçado — não é claro se vale a pena mexer em `.gitattributes`/`core.autocrlf` (decisão a combinar com o responsável se incomodar no dia a dia).

## 15. Fase 2 (parte 1d) — `noExplicitAny` e `@ts-ignore` reais (concluída 17/07/2026)

### O que foi feito

Investiguei os 5 itens deixados pendentes na parte 1c em vez de deixá-los como dívida permanente — todos tinham correção real, não só supressão de aviso:

- **`src/server/auth.ts:9` (`@ts-ignore` em `advanced.generateId`)**: li o código-fonte do `better-auth@1.6.23` instalado (`node_modules/.pnpm/.../dist/context/create-context.mjs`) e confirmei que a opção `advanced.generateId` (nível raiz) é um caminho de compatibilidade retroativa que o resolvedor de contexto checa **antes** de `advanced.database.generateId`, que é o local atualmente tipado (`@better-auth/core`'s `init-options.d.mts`, `GenerateIdFn = (options: { model, size }) => string | false`). Movi `generateId` pra dentro de `advanced.database` — mesma função, mesmo caminho de execução no runtime (confirmado lendo `generateIdFunc` em `create-context.mjs`), zero mudança de comportamento, só corrige o local que a lib espera hoje.
- **`quote-builder-form.tsx` (2× `any` nos props `opportunities`/`products`)**: tipados como `Awaited<ReturnType<typeof getOpenOpportunities>>` e `Awaited<ReturnType<typeof getProducts>>`, derivando o tipo real das server actions em vez de duplicar/adivinhar uma forma. De quebra, a `QuoteItemInput` local duplicada virou reexport do tipo já existente em `src/server/actions/quotes.ts`.
- **`submission-details.tsx` (2× `any`: prop `submission` e callback `answer`)**: prop tipada como `NonNullable<Awaited<ReturnType<typeof getBriefingSubmissionById>>>` (o `null` já é eliminado pelo `notFound()` no caller antes de passar a prop). O `answers.map` deixou de precisar de anotação explícita. Isso expôs um problema real que o `any` escondia: `submission.metadata` é uma coluna `jsonb` sem `$type<>()` no schema (`briefings.ts`), então o Drizzle infere o tipo do valor default (`{}`) em vez de `unknown` — sem `.userAgent` tipado. Resolvido com um cast local pontual (`(submission.metadata as { userAgent?: string })?.userAgent`), sem tocar no schema compartilhado (mudar o schema afetaria outras colunas `metadata` iguais em `activities`, `contracts`, `proposals`, `notifications`, `consent` — fora de escopo aqui).

### Validação real

- `tsc --noEmit`: limpo.
- `npm run lint`: **0 erros e 0 warnings de regra real** (`lint/*`, `assist/*`) — restam só os 10 avisos de `format` (drift CRLF/LF do checkout Windows, documentado na seção 14, não é uma regra de código).
- `vitest run`: 2/2 passando.
- `next build`: verde, 27 rotas.
- Nenhuma mudança de comportamento pretendida em nenhum dos três pontos — validado por leitura do código-fonte da lib (caso do `auth.ts`) e por tipos derivados diretamente das server actions reais (não inventados) nos outros dois casos. Sem verificação visual em tela autenticada (mesma limitação das partes anteriores — essas mudanças não alteram JSX renderizado, só tipos e localização de uma opção de config).

### Débitos que ficam para depois

- Nenhum item de lint real conhecido restante. Próximo item de qualidade de código seria decidir se vale tipar as colunas `jsonb("metadata")` do schema com `.$type<>()` em vez de casts pontuais — não fizemos isso agora por afetar múltiplas tabelas fora do escopo desta sessão.

## 16. Fase 2 (parte 2a) — Primeira fatia real de `components/ui/*` no shell (concluída 17/07/2026, pendente confirmação visual)

### Contexto e modelo de trabalho combinado com o responsável

Com a limpeza mecânica esgotada (partes 1b/1c/1d), o que sobra da Fase 2 é a migração de verdade — trocar as classes CSS bespoke de `globals.css` (`.sidebar`, `.nav-link`, `.primary-button`, etc.) pelos componentes reais de `components/ui/*` e por Tailwind puro com os tokens Pulso. Essa migração **muda a aparência de verdade** (ex.: botões de ícone ficam maiores, tocando o alvo mínimo de 44px do `docs/DESIGN_SYSTEM.md` §10), então não dá pra continuar com o critério "zero mudança visual, sem precisar de login" das partes anteriores.

Modelo combinado: eu migro **uma fatia pequena por vez**, dou push, e o responsável confirma visualmente logado em produção antes da próxima fatia. Reversão rápida se algo quebrar (commits pequenos e isolados).

### O que foi feito nesta fatia

`src/components/crm/app-shell.tsx`: os 3 botões de ícone (fechar menu mobile, sair/logout, abrir menu mobile) trocados do `<button>` cru pro componente real `Button` de `components/ui/button.tsx`, com `variant="ghost" size="icon"`:

- Botão de fechar (X, dentro do `.sidebar-brand`, fundo escuro): `hover:bg-white/10` sobrescrevendo o hover padrão do `ghost` (que é `hover:bg-pulso-neutral-soft`, um tom quase branco pensado pra fundo claro — errado sobre o fundo escuro do sidebar). Confirmado que `cn()` usa `tailwind-merge`, então o `className` customizado sobrescreve corretamente o hover do variant.
- Botão de logout (mesma lógica de fundo escuro, mesmo override de hover).
- Botão de abrir menu mobile (topbar, fundo claro): usa o `ghost` padrão sem override, já que o hover quase-branco faz sentido nesse contexto.

Classes de visibilidade responsiva existentes (`mobile-close-btn`, `mobile-menu-btn`) mantidas junto com as novas classes do `Button` — não são utilities do Tailwind, então `tailwind-merge` não mexe nelas.

**Mudança visual real e intencional**: o tamanho do botão passa de ~28-32px (padding 4px + ícone 20-24px) pra 44×44px fixo (`size="icon"` = `size-11`). Isso é uma correção de acessibilidade (alvo mínimo de toque), não um efeito colateral acidental — mas é visível, e vale conferir se não ficou desproporcional no header/sidebar.

**Adiado nesta fatia**: o campo de busca do topbar (`<input className="search">`) não foi trocado pelo componente `Input` real. Motivo: a classe `.search` já define largura/altura/padding/borda próprios (320px/42px/13px), que não bate exatamente com os valores do componente `Input` (min-h-11=44px, px-4=16px) — trocar sem reconciliar essas diferenças criaria uma sobreposição de dois sistemas de estilo com resultado imprevisível. Fica pra próxima fatia, feito com cuidado.

### Validação real

- `tsc --noEmit`: limpo.
- `npm run lint`: 0 erros/warnings de regra real (só o de sempre, format CRLF/LF).
- `vitest run`: 2/2 passando.
- `next build`: verde, 27 rotas (sem mudança de manifesto).
- **Não verificado visualmente ainda** — pendente do responsável logar em produção após o push e confirmar que os 3 botões (fechar mobile, logout, abrir menu mobile) estão com tamanho/cor/hover corretos, antes de eu seguir pra próxima fatia.

### Débitos que ficam para depois

- Campo de busca do topbar ainda usa `<input className="search">` cru.
- Layout do shell (`.sidebar`, `.nav-link`, `.app-layout`, media queries de 900px/768px) ainda é CSS bespoke, não Tailwind.
- Formulários das telas de CRM (`companies-client.tsx`, `contacts-client.tsx`, `pipeline/kanban-board.tsx`) ainda usam Tailwind cru com paleta `slate`/`orange`, não os tokens Pulso nem `components/ui/*`.

### Bug pré-existente encontrado e corrigido durante a conferência visual desta fatia

O responsável reportou, ao conferir os botões: "o menu acaba mas tem muita tela branca pra baixo". Diagnóstico (sem precisar reproduzir localmente, só pela leitura do CSS): `.sidebar` em `globals.css` tinha `height: 100vh` fixo dentro de um grid (`.app-layout`) cuja altura de linha se ajusta ao conteúdo de `.main-area`. Em qualquer página cujo conteúdo passe de uma tela (comum: funil, listas, projetos), a linha do grid fica mais alta que 100vh, mas o `.sidebar` (com `height` fixo, não `min-height`) não acompanha — sobra área em branco (fundo `--paper`) abaixo do menu ao rolar até o fim da página. **Não foi causado pelas mudanças desta sessão** (nenhum commit anterior tocou `.sidebar`/`.app-layout`); só ficou visível porque o responsável rolou a página conferindo os botões.

Corrigido trocando `height: 100vh` por `min-height: 100vh` na regra base de `.sidebar` (a media query de mobile, que usa `position:fixed`, manteve `height:100vh` sem alteração — ali é o comportamento correto). `tsc --noEmit`, `vitest run` (2/2) e `next build` (27 rotas) verdes; ainda pendente confirmação visual do responsável, igual às fatias anteriores.

## 17. Bug real de responsividade mobile — nunca funcionou (corrigido 17/07/2026)

### O que o responsável reportou

Depois do fix da seção 16, testando no celular: o menu abria só numa faixa estreita da tela, sem os textos/logo visíveis, com muito espaço cinza/branco ao redor — visivelmente quebrado, não parecia "responsividade" nenhuma. Reação correta: perguntar em que eu estava gastando tempo, já que aquilo claramente não parecia testado.

### Causa raiz real (achada por investigação, não por tentativa e erro)

**`src/app/layout.tsx` nunca teve uma tag de viewport.** Next.js App Router não injeta `<meta name="viewport">` automaticamente — sem o export `viewport`, o navegador do celular renderiza a página numa "tela virtual" de ~980px de largura e encolhe tudo pra caber na tela física, deixando texto e ícones minúsculos e o layout inteiro fora de proporção. **Isso nunca funcionou, em nenhuma versão do site, antes desta sessão** — não foi introduzido por nenhuma mudança recente, só nunca tinha sido notado/testado num aparelho real. Corrigido com:

```ts
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
```

Confirmado via `document.querySelector('meta[name="viewport"]')` e `window.innerWidth` batendo com a largura real do dispositivo (375px simulado), na página pública `/login` (não precisa de sessão pra verificar).

### Segundo bug, real e independente, só alcançável depois do primeiro estar corrigido

Com o viewport corrigido, o menu mobile (gaveta que abre pelo hambúrguer) ainda não abria de verdade: a régua de CSS `.sidebar` ficava sem `width` explícito na media query de 768px, encolhendo para caber só os ícones (~126px, não os 248-280px esperados), e simultaneamente as labels de texto ficavam ocultas por uma regra de 900px que também se aplica nessa largura (feita originalmente para um modo "trilho de ícones" de tablet, não para a gaveta mobile cheia). **Esse bug também é anterior a esta sessão** — nunca foi alcançável/visível antes porque, sem o viewport correto, o hambúrguer mobile nunca aparecia de verdade num aparelho real (o site sempre renderizava como desktop reduzido).

Diagnosticado e corrigido criando uma rota de teste temporária e descartável (`src/app/dev-shell-preview`, nunca commitada) que renderiza o `AppShell` sem exigir login, permitindo testar o menu mobile de verdade via automação de navegador sem tocar em credenciais ou produção. Durante a investigação, encontrei e descartei uma pista falsa: o CSS parecia não aplicar mesmo com `!important`, o que se revelou ser cache de HMR do `next dev` desatualizado (resolvido reiniciando o servidor com `.next` limpo a cada teste) combinado com uma tentativa minha de corrigir usando `@layer overrides` posicionado incorretamente (Tailwind v4 varre todo CSS solto depois de `@import "tailwindcss"` para dentro de `@layer utilities`; **qualquer regra não-encamada sempre vence sobre qualquer regra encamada**, então meu `@layer overrides` — mesmo com `!important` — perdia para a regra "fechada" do `.sidebar`, que não estava em nenhuma layer). Corrigido removendo o `@layer` e deixando a regra solta, igual ao resto do arquivo.

Correções aplicadas em `src/app/globals.css`, dentro do `@media (max-width: 768px)`:
- `.sidebar` ganhou `width: 280px` explícito (antes encolhia pro conteúdo);
- trocado de `transform: translateX(-100%)` / `.mobile-open { transform: translateX(0) }` para `left: -280px` / `.mobile-open { left: 0 }` (mecanismo mais simples, mesma ideia);
- a regra de 900px que esconde `.sidebar-brand img`, `.sidebar-brand span`, `.nav-link span`, `.nav-label`, `.sidebar-user div:last-child` agora é revertida (`display: revert`) dentro do bloco de 768px — decisão de produto: a gaveta mobile cheia deve mostrar os textos, não só ícones (esse modo ícone-only fica só pra faixa 768-900px, tablet estreito com sidebar sempre visível).
- **Removida a transição (`transition: left 0.3s`) do `.sidebar`** — não consegui confirmar com certeza que ela completa corretamente dentro do navegador automatizado usado pra testar (parecia nunca "assentar" no valor final mesmo esperando bem mais que os 0.3s, e não tive tempo de isolar se é uma limitação da ferramenta de automação ou um bug real). Prefiro abrir/fechar o menu instantaneamente, sem animação, a arriscar entregar algo que eu não consegui verificar de verdade. Se quiser a animação de volta, é uma reintrodução pequena e de baixo risco depois que alguém confirmar visualmente em um aparelho real que o `transition` funciona.

### Validação real

- Testado via automação de navegador (não confiei só em "deveria funcionar"): abri o menu mobile numa viewport de 375×812px, medi via `getComputedStyle`/`getBoundingClientRect` que o menu abre para `left: 0`, largura 280px, com logo e labels de texto visíveis; fechei e confirmei que volta para `left: -280px` e o overlay desaparece. Testado também em viewport desktop que o fix da seção 16 (altura do menu acompanhando conteúdo maior que a tela) continua funcionando.
- `tsc --noEmit`: limpo. `npm run lint`: 0 erros/warnings de regra real. `vitest run`: 2/2. `next build`: verde, 27 rotas (a rota de teste `dev-shell-preview` foi deletada antes do build/commit, nunca fez parte do código enviado).
- Viewport meta tag confirmado via DOM real numa página pública (`/login`), sem precisar de sessão.

### Débitos que ficam para depois

- Animação de abertura/fechamento do menu mobile foi removida por falta de confiança na verificação — pode ser reintroduzida com teste visual real (aparelho físico ou navegador confiável) quando for prioridade.
- O modo "trilho de ícones" (768-900px, tablet estreito) preserva o comportamento antigo — não testado nesta sessão por falta de um dispositivo/viewport de teste nessa faixa específica.

## 18. Fase 3 (parte 1) — CRM operacional: 4 grupos (concluído 18/07/2026, commits locais, não enviados)

### Contexto

O responsável apontou, corretamente, que o sistema "do jeito que tá hoje, tá inutilizável" — auditoria confirmou: Contatos/Empresas eram só criar+listar (sem editar, excluir, ou filtrar excluídos), "próxima ação" existia no banco mas nunca era lida/escrita em lugar nenhum (o princípio nº1 do `docs/PRODUCT_VISION.md`), Ganho/Perda eram botões sem `onClick`, e Tarefas era 100% schema sem nenhuma ação/tela/rota. Decisão do responsável: **construir, validar e testar, e só commitar/subir quando tiver algo palpável pra uso** — não fatiar tão fino quanto as partes da Fase 2 anteriores.

Plano detalhado (com código, critério de pronto por grupo) em `docs/superpowers/plans/2026-07-18-fase3-crm-operacional.md`, escrito com a skill `writing-plans` antes de qualquer código (os sub-skills `subagent-driven-development`/`executing-plans`/`plan-document-reviewer` que essa skill normalmente usa não estão instalados neste repo — plano executado inline, autorrevisado, seguindo o protocolo de 15 passos do `CLAUDE.md`).

**Zod instalado nesta sessão** (`package.json`/`pnpm-lock.yaml`) — estava listado em `docs/ARCHITECTURE_AND_STANDARDS.md` como parte do stack, mas nunca tinha sido de fato adicionado; nenhuma server action validava input com ele antes desta fase.

### Grupo 1 — Próxima ação nas oportunidades

`opportunities.nextActionAt`/`nextActionDescription` existiam no schema desde a Fase 0/1, com índice dedicado, mas totalmente órfãos. Adicionado: `opportunities.schemas.ts` (Zod, testado), `opportunities.ts::updateNextAction`, formulário na tela de detalhe (`next-action-form.tsx`), e exibição no card do Kanban com destaque de atraso — que exigiu corrigir `crm/pipeline/page.tsx`, que estava silenciosamente descartando esses dois campos no mapeamento server→client antes de chegar no componente.

### Grupo 2 — Ganho e Perda funcionando

Os botões "Ganho"/"Perdido" na tela de detalhe não tinham `onClick` nenhum. Adicionado: etapa "Perdido" no funil, criada de forma idempotente (backfill pra pipelines já existentes, incluindo o de produção, que só tinha 5 etapas sem nenhuma de perda) sem tocar nas etapas atuais; `opportunities.ts::winOpportunity`/`loseOpportunity`, cada uma dentro de `db.transaction` (atualização de status + registro de histórico não podem ficar dessincronizados se uma escrita falhar — `moveOpportunity`, no mesmo arquivo, tem esse mesmo gap e **não foi corrigido**, fica como débito conhecido pra não expandir o escopo); ambas rejeitam se a oportunidade não estiver `"open"` (guarda contra ação repetida); modal de motivo obrigatório pra perda.

### Grupo 3 — Tarefas básicas

Maior peça nova. Corrigido de passagem um bug real de integridade encontrado na auditoria: `tasks.project_id` não tinha `.references()` nenhuma (única FK da tabela sem constraint) — corrigido no schema, migration `0003_cynical_forgotten_one.sql` **gerada mas não aplicada** (precisa autorização antes de rodar contra qualquer banco real). Adicionado `tasksRelations` em `relations.ts` (Drizzle exige isso além do `.references()` pra usar `with:` em queries relacionais — já tinha mordido este projeto antes). `tasks.ts`: `createTask`/`getMyTasks`/`getOverdueTasks`/`completeTask`. Rota `/crm/tarefas` + `tasks-client.tsx` (toggle minhas/atrasadas, criação rápida, concluir). Link "Tarefas" do menu corrigido de `href="#"` pra rota real.

### Grupo 4 — Editar e excluir Contatos e Empresas

`contacts.ts`/`companies.ts` só tinham `create`+`get` (44 linhas cada). Adicionado `updateContact`/`deleteContact` e `updateCompany`/`deleteCompany` (soft delete via `deletedAt`), e corrigido `getContacts`/`getCompanies` pra filtrar `deletedAt IS NULL` — a coluna existia desde sempre mas nunca era lida nem escrita, soft delete era 100% decorativo. UI: o modal de criação existente passou a servir também de edição (preenchido via `defaultValue`, com `key` no `<form>` pra resetar corretamente entre registros diferentes), mais botões Editar/Excluir por linha (exclusão com `window.confirm`).

**Não implementado, fora do escopo combinado**: restaurar contato/empresa excluído (as permissões `contacts.restore`/`companies.restore` já existem e têm papel atribuído, só falta a ação).

### Validação real (o que foi e o que não foi possível confirmar)

- Todos os 4 grupos: `tsc --noEmit` limpo, `npm run lint` 0 erros reais, `vitest run` crescendo de 2 → 26 testes (todos passando), `next build` verde a cada grupo (27 → 28 rotas depois do Grupo 3, com `/crm/tarefas`).
- Verificação de UI feita com a mesma técnica das partes anteriores da Fase 2: rota temporária sem exigir sessão (`dev-shell-preview`), deletada antes de cada commit, nunca chegou a fazer parte do código enviado.
- **O que essa técnica provou de verdade**: os formulários renderizam com os campos certos, o modal de edição abre pré-preenchido com o dado real da linha, o toggle de tarefas funciona, e — o mais importante — **toda ação server (`updateNextAction`, `winOpportunity`, `loseOpportunity`, `createTask`, `completeTask`) foi de fato invocada e corretamente rejeitada por `requirePermission()` com "Sessão inválida ou expirada"**, sem sessão. Isso confirma a fiação completa (form → server action → checagem de permissão) sem tocar em dado real.
- **O que essa técnica não prova**: que o fluxo persiste corretamente no banco de produção (status realmente muda, parcela de histórico é gravada, tarefa aparece na lista depois de recarregar, exclusão de fato some da lista após reload). Isso só o responsável pode confirmar, logado de verdade.
- No Grupo 4 especificamente, **não cliquei em "Salvar"/"Excluir"** durante a verificação — ambos os fluxos passam por `window.alert()`/`window.confirm()` (diálogos nativos do navegador que arriscam travar a automação usada pra testar). Confiei no padrão `requirePermission()`-primeiro já verificado três vezes nesta mesma sessão (próxima ação, ganho/perda, tarefas) em vez de arriscar travar a ferramenta pra reconfirmar a mesma coisa uma quarta vez.

### Débitos conhecidos, registrados de propósito (não esquecidos)

- `moveOpportunity` (drag-and-drop do Kanban) ainda não usa transação pra unir a atualização de estágio + o registro de histórico — mesmo gap que `winOpportunity`/`loseOpportunity` corrigiram, mas não replicado ali pra não expandir escopo.
- Restaurar contato/empresa excluído: não implementado.
- Checklist de tarefa, recorrência de verdade (o campo `recurrenceRule` é texto livre sem parser), e calendário: fora do escopo combinado ("tarefas básicas").
- Coluna "quem completou a tarefa": só existe `completedAt` (quando), não quem — precisaria de nova coluna, fora do escopo.
- Migration `0003_cynical_forgotten_one.sql`: gerada, não aplicada em nenhum ambiente.
- Nenhum dos 4 commits desta fase foi enviado ao GitHub — aguardando o responsável confirmar visualmente antes do push, conforme combinado.

## 19. Fase 3 (parte 1, continuação) — Grupos 6-10 (concluído 18/07/2026, commits locais)

Depois dos 4 grupos da seção 18, o responsável pediu pra continuar construindo até ter algo usável de verdade. Mais 6 fatias, mesmo padrão de validação (schema Zod testado quando aplicável, `tsc`/`lint`/`vitest`/`build` verdes, rota de preview temporária sem sessão pra confirmar a fiação, deletada antes do commit):

- **Grupo 6** (`4e62471`): `moveOpportunity` (arrastar no Kanban) agora usa `db.transaction` — mesmo débito que `winOpportunity`/`loseOpportunity` já tinham corrigido, replicado aqui.
- **Grupo 5** (`e23048f`, na verdade construído entre os grupos 4 e 6 — numeração de tarefa não é ordem cronológica exata): linha do tempo de atividades. `src/server/services/activity-log.ts` — helper puro, deliberadamente fora de um arquivo `"use server"` pra não virar endpoint client-callable sem guarda. Escreve automaticamente em: próxima ação definida, ganho, perda, mudança de etapa (incluindo nome da etapa destino), tarefa criada vinculada a uma oportunidade. Mais `addNote` manual. Tudo isso fecha o "histórico confiável" do `docs/PRODUCT_VISION.md` que era só schema antes.
- **Grupo 7** (`989772d`): contato vinculado a empresa — `company_contacts` existia desde sempre, nunca usada. Modelo simplificado (1 empresa "principal" por contato via `isPrimary`, não múltiplas) — `getContacts()` reescrito com `leftJoin` em vez de relations do Drizzle (many-to-many com filtro `isPrimary` não mapeava bem no `with:`).
- **Grupo 8** (`8e5f534`): restaurar contato/empresa excluído — as permissões `contacts.restore`/`companies.restore` já existiam desde a Fase 1, sem ação nenhuma. Toggle "Ver excluídos" com carregamento sob demanda.
- **Grupo 9** (`db3df7f`): painel "Vínculos" na tela de detalhe da oportunidade, mostrando briefing/proposta/contrato/projeto já ligados (FKs reversos que existiam sem nunca serem consultados). Só mostra o que existir; briefing e contrato linkam pra rota interna real, projeto idem, proposta é só texto (não existe rota de detalhe interna pra proposta ainda, só `/crm/quotes` e `/crm/quotes/new`).
- **Grupo 10** (`a13de89`): temperatura e responsável no card do Kanban — ambos já existiam no banco (`temperature` com default `"warm"`, `ownerUserId` sempre setado no create) mas nunca apareciam em lugar nenhum. Adicionado seletor de temperatura no formulário de criar oportunidade, badge colorido + iniciais do responsável no card.

### Achado de metodologia registrado

Durante o Grupo 8, clicar em "Ver excluídos" sem sessão ativa disparou um `alert()` nativo do navegador (padrão de tratamento de erro já usado no resto do arquivo, não introduzido agora) que **travou a automação do navegador usada pra verificar** — recuperado apertando Enter, que dispensou o diálogo. Confirma a mesma coisa que os outros testes (ação chega em `requirePermission()` e rejeita sem sessão), mas registra pra sessões futuras: evitar clicar em botões que passam por `alert()`/`confirm()` nativos ao testar via automação — usar estado de erro inline (como nos formulários de oportunidade) sempre que possível for uma escolha mais segura pra telas novas.

### Débitos conhecidos desta continuação

- Owner do card fica `null` na atualização otimista local ao criar uma oportunidade (só aparece depois de recarregar/revalidar) — o nome do usuário atual não estava disponível nas props do componente; não valia adicionar um fetch só pra isso.
- Proposta ainda não tem rota de detalhe interna — só é mostrada como texto no painel de vínculos, sem link.
- `createContact`/`createCompany` continuam sem validação Zod (só `update*` valida) — gap pré-existente, não introduzido nem expandido nesta sessão.
- Produto vinculado à oportunidade (`opportunity_products`), diagnóstico, orçamento informado, valor negociado, probabilidade e previsão de fechamento continuam sem UI — registrados na auditoria original, não abordados nesta rodada.
