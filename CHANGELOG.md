# CHANGELOG — PULSO CRM

Todas as mudanças relevantes devem ser registradas aqui.

## [Não lançado]

### Adicionado

- Pacote de documentação para execução estruturada pelo Claude.
- Decisão formal de CRM interno e exclusivo da PULSO.
- Protocolo de implementação, qualidade e segurança.

### Alterado

- Removida da direção do produto qualquer intenção de SaaS, white label, billing ou comercialização do CRM.

### Segurança

- Registrada necessidade de remover credencial administrativa do seed e rotacionar a senha.

---

## [2026-07-17] — Fase 0: auditoria, seed seguro e ponte de design tokens

### Corrigido

- `src/server/db/seed.ts`: removida a senha administrativa hardcoded (`pulso_admin_secure`) e o `console.log` que a expunha. Seed agora exige `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` via ambiente e falha com erro claro se ausentes. Seed passou a ser idempotente (organização, papel e usuário são reaproveitados se já existirem).
- `src/app/globals.css`: adicionado bloco `@theme` ligando os tokens Pulso já existentes (`--paper`, `--carbon`, `--signal`...) às classes Tailwind que `components/ui/*` já esperava (`bg-pulso-signal`, `rounded-card`, `duration-base`, etc.), que antes não existiam e não renderizavam nada.

### Adicionado

- `.env.example`: documentadas as variáveis `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
- Pacote `CLAUDE.md` / `IMPLEMENTATION_STATUS.md` / `docs/*` copiado para a raiz do repositório, substituindo a orientação anterior de possível SaaS/white label.

### Segurança

- Senha administrativa ainda ativa em produção com o hash antigo; rotação pendente de autorização explícita (não executada nesta fase, que é somente-leitura em produção).
- `BETTER_AUTH_SECRET` confirmado como não persistido na configuração salva do Dokploy — regride a cada redeploy iniciado por push/UI.

### Testes

- `biome check .`: 43 erros (nenhum bloqueante), detalhados em `IMPLEMENTATION_STATUS.md`.
- `tsc --noEmit`: limpo.
- `vitest run`: 2/2 passando.
- `next build`: verde, 30 rotas.

### Migrações

- `0002_safe_exiles.sql` (adiciona `projects.contract_id`) confirmada aplicada em produção; 0 referências órfãs.

---

## [2026-07-17] — Fase 1: workspace, papéis e autorização real

### Adicionado

- `src/server/auth/permission-keys.ts`: catálogo tipado de permissões e mapeamento papel→permissão para os 6 papéis (`owner`, `admin`, `commercial`, `projects`, `finance`, `viewer`).
- `src/server/auth/require-permission.ts`: helper central `requirePermission(key)` — resolve sessão, membership ativo e papel no servidor, confere permissão via banco, nunca confia em `organizationId` do cliente.
- `src/server/db/seed-permissions.ts`: seed idempotente de permissões/papéis, migra o antigo papel `super_admin` para `owner` em vez de duplicar. Executado contra produção: 69 permissões e 6 papéis criados, admin existente migrado com sucesso.
- `updateProduct` em `src/server/actions/products.ts` (faltava; a página de edição fazia `db.update` direto, sem filtro de organização).

### Corrigido

- Toda server action interna (`pipeline`, `companies`, `contacts`, `products`, `quotes`, `briefing-templates`, `briefing-submissions`, `contracts`, `projects`) agora exige sessão e permissão via `requirePermission()` e usa o `organizationId`/`userId` resolvido no servidor — nenhuma mais confia em valor recebido como parâmetro. As públicas por token (`getPublicContract`, `signContractPublic`) continuam sem sessão, como deveria ser.
- `toggleChecklistItem` (projetos) não verificava organização nenhuma antes de atualizar um item por ID; agora confirma que o projeto pertence ao workspace do usuário.

### Testes

- `tsc --noEmit`, `vitest run` (2/2), `next build` (30 rotas): verdes.
- Validação manual de ponta a ponta com `next dev` apontado para o banco de produção via túnel SSH: login, `/crm/pipeline` (leitura + criação de oportunidade), `/crm/contatos`, `/crm/empresas`, `/crm/quotes`, `/crm/contratos`, `/crm/projetos`.

---

## [2026-07-17] — Fase 2 (parte 1): limpeza de rotas mockadas e correção de navegação

### Removido

- `/crm` (`src/app/crm/page.tsx`), `/briefings` (`src/app/briefings/page.tsx`) e `/orcamentos/novo` (`src/app/orcamentos/novo/page.tsx`) — rotas internas 100% mockadas, órfãs, coexistindo com as versões reais (`/crm/pipeline`, `/crm/briefings/inbox`, `/crm/quotes/new`).
- Componentes e dados que só essas rotas usavam: `src/components/crm/kanban-board.tsx` (mock), `src/components/briefings/briefing-inbox.tsx`, `src/components/proposals/proposal-builder.tsx`, `src/data/opportunities.ts`, `src/data/briefings.ts`.

### Corrigido

- `src/components/crm/app-shell.tsx`: item de navegação "Briefings" apontava para a rota mockada `/briefings` em vez da real `/crm/briefings/inbox` — qualquer usuário clicando no menu caía na versão fake.

### Testes

- `tsc --noEmit`, `vitest run` (2/2): verdes.
- `next build`: verde, 27 rotas (30 → 27).
- `biome check .`: 28 erros (queda de 43, dívida de a11y dos componentes mock removidos foi junto).
- `next dev` local: confirmado ao vivo que as três rotas removidas retornam 404.

---

## [2026-07-17] — Fase 2 (parte 1b): extração mecânica de inline styles do shell

### Alterado

- `src/components/crm/app-shell.tsx`: os 8 blocos de `style={{...}}` inline viraram classes Tailwind equivalentes (ex.: `gap: "12px"` → `gap-3`, `backgroundColor: "rgba(0,0,0,0.5)"` → `bg-black/50`), sem alterar layout, estrutura ou as classes CSS bespoke existentes (`.sidebar`, `.nav-link`, etc.). Mudança concebida para não ter diferença visual — a migração real do shell para `components/ui/*` continua pendente.

### Testes

- `tsc --noEmit`, `vitest run` (2/2), `next build` (27 rotas): verdes.
- Sem verificação visual em tela autenticada nesta sessão (decisão explícita do responsável, ver `IMPLEMENTATION_STATUS.md` seção 13).

---

## [2026-07-17] — Fase 2 (parte 1c): limpeza de lint de acessibilidade

### Corrigido

- `companies-client.tsx`, `contacts-client.tsx`, `pipeline/kanban-board.tsx`: 16 labels de formulário sem `htmlFor`/`id` associados (`lint/a11y/noLabelWithoutControl`) e 4 botões sem `type="button"` explícito (`lint/a11y/useButtonType`). Sem mudança visual — só atributos HTML.
- `src/server/db/seed.ts`: `import crypto from "crypto"` → `import crypto from "node:crypto"` (`lint/style/useNodejsImportProtocol`).

### Testes

- `tsc --noEmit`, `vitest run` (2/2), `next build` (27 rotas): verdes.
- `npm run lint`: 28-29 → 10 erros / 5 warnings. Restante é `noExplicitAny` (4) e `noTsIgnore` (1), deixados de propósito por exigirem entender o tipo real dos dados antes de corrigir — não são mecânicos.

---

## [2026-07-17] — Fase 2 (parte 1d): noExplicitAny e @ts-ignore reais corrigidos

### Corrigido

- `src/server/auth.ts`: `advanced.generateId` movido para `advanced.database.generateId` (local correto na versão instalada do `better-auth`, confirmado lendo o código-fonte da lib — mesmo caminho de execução, zero mudança de comportamento). `@ts-ignore` removido.
- `src/app/crm/quotes/new/quote-builder-form.tsx`: props `opportunities`/`products` tipados a partir do retorno real das server actions (`Awaited<ReturnType<typeof getOpenOpportunities/getProducts>>`) em vez de `any[]`. `QuoteItemInput` local duplicada virou reexport do tipo já existente em `quotes.ts`.
- `src/components/crm/briefings/submission-details.tsx`: prop `submission` tipada via `NonNullable<Awaited<ReturnType<typeof getBriefingSubmissionById>>>`. Exposto e corrigido um problema real que o `any` escondia: `submission.metadata` (coluna `jsonb` sem `$type<>()`) não tinha `.userAgent` tipado — resolvido com cast local pontual, sem tocar no schema compartilhado.

### Testes

- `tsc --noEmit`, `vitest run` (2/2), `next build` (27 rotas): verdes.
- `npm run lint`: **0 erros/warnings de regra real** — zera toda a dívida de lint da baseline da Fase 0 (43 → 0). Restam só avisos de `format` (CRLF/LF do checkout Windows, pré-existente, fora de escopo).

---

## [2026-07-17] — Fase 2 (parte 2a): primeiro uso real de components/ui/* no shell

### Alterado

- `src/components/crm/app-shell.tsx`: os 3 botões de ícone (fechar mobile, logout, abrir menu mobile) trocados do `<button>` cru pelo componente real `Button` (`variant="ghost" size="icon"`). **Mudança visual intencional**: botões agora têm 44×44px fixo (antes ~28-32px), atendendo o alvo mínimo de toque do design system. Hover sobrescrito pra `hover:bg-white/10` nos dois botões sobre fundo escuro do sidebar (o hover padrão do `ghost` é pensado pra fundo claro).

### Testes

- `tsc --noEmit`, `vitest run` (2/2), `next build` (27 rotas), `npm run lint` (0 erros reais): verdes.
- Sem verificação visual ainda — pendente confirmação do responsável logado em produção (modelo combinado: uma fatia pequena por vez, push, confirmação visual, próxima fatia).

---

## [2026-07-17] — fix: sidebar não cobria páginas mais altas que a tela

### Corrigido

- `src/app/globals.css`: `.sidebar` tinha `height: 100vh` fixo dentro de um grid cuja linha se ajusta ao conteúdo de `.main-area`. Em páginas com conteúdo maior que uma tela (funil, listas, projetos), sobrava espaço em branco abaixo do menu lateral ao rolar até o fim. Trocado para `min-height: 100vh`, permitindo que o menu acompanhe a altura real da página. Bug pré-existente, reportado pelo responsável ao conferir a fatia anterior (botões de ícone) — não foi causado por ela.

### Testes

- `tsc --noEmit`, `vitest run` (2/2), `next build` (27 rotas): verdes.
- Pendente confirmação visual do responsável.

---

## [2026-07-17] — fix: responsividade mobile nunca funcionou de verdade

### Corrigido

- `src/app/layout.tsx`: **faltava a tag de viewport** (`<meta name="viewport">`). Sem ela, celulares renderizavam a página numa tela virtual de ~980px e encolhiam tudo pra caber, deixando o site inteiro minúsculo e desproporcional em qualquer aparelho — não só o menu. Adicionado `export const viewport: Viewport = { width: "device-width", initialScale: 1 }`. Bug pré-existente, nunca causado por nenhuma mudança desta sessão.
- `src/app/globals.css`: o menu mobile (gaveta aberta pelo hambúrguer) nunca abria de verdade — `.sidebar` não tinha `width` explícito na media query de 768px (encolhia pro conteúdo, ~126px) e as labels de texto ficavam ocultas por uma regra pensada pro modo "trilho de ícones" de tablet (768-900px), que também se aplica em telas de celular. Corrigido: `width: 280px` explícito, troca de `transform: translateX` por `left` (mais simples de depurar), e `display: revert` pras labels dentro do breakpoint mobile. Também pré-existente, só nunca foi alcançável/visível antes por causa do bug do viewport acima (sem ele, o hambúrguer mobile nunca aparecia de verdade num aparelho real).
- Removida a transição de abertura do menu mobile (`transition: left 0.3s`) — não consegui confirmar com certeza que ela completa corretamente na ferramenta de automação usada pra testar; prefiro abrir/fechar instantâneo, sem animação, a arriscar entregar algo não verificado. Reintrodução é de baixo risco quando alguém confirmar visualmente em aparelho real.

### Testes

- Verificado via automação de navegador numa viewport de 375×812px: menu abre pra `left:0`, largura 280px, logo e labels visíveis; fecha corretamente. Viewport meta tag confirmado via DOM real na página pública `/login` (sem precisar de sessão).
- `tsc --noEmit`, `vitest run` (2/2), `next build` (27 rotas), `npm run lint` (0 erros reais): verdes.

---

## [2026-07-18] — Fase 3 (parte 1): CRM operacional (4 grupos, commits locais)

### Adicionado

- Zod instalado como dependência real (estava só documentado, nunca usado).
- Oportunidades: próxima ação (`updateNextAction`, formulário, card do Kanban com destaque de atraso); ganho/perda funcionando de verdade (`winOpportunity`/`loseOpportunity`, transação, etapa "Perdido" idempotente no funil, modal de motivo obrigatório).
- Tarefas: módulo novo do zero — `createTask`/`getMyTasks`/`getOverdueTasks`/`completeTask`, rota `/crm/tarefas`, link do menu corrigido.
- Contatos e Empresas: editar e excluir (soft delete real — a coluna `deletedAt` existia mas nunca era usada).

### Corrigido

- `tasks.project_id` não tinha `.references()` — migration gerada (não aplicada), corrigindo a única FK da tabela sem constraint.
- `crm/pipeline/page.tsx` estava descartando `nextActionAt`/`nextActionDescription` no mapeamento server→client.
- Removido código morto (`_linkedBriefing`) da tela de detalhe de oportunidade.

### Testes

- `vitest run`: 2 → 26 testes (Zod schemas de todos os módulos novos, TDD).
- `tsc --noEmit`, `npm run lint`, `next build`: verdes em cada um dos 4 grupos.
- Verificado via rotas de preview temporárias (deletadas antes de cada commit): toda ação server tocada corretamente atinge `requirePermission()` e rejeita sem sessão — confirma a fiação completa sem tocar em dado real. Fluxo de banco de ponta a ponta ainda precisa de confirmação do responsável logado.

### Pendências

- 4 commits locais, não enviados ao GitHub — aguardando confirmação visual do responsável.
- Migration da FK de `tasks.project_id` gerada, não aplicada em nenhum ambiente.

---

Formato recomendado por alteração:

```text
## [AAAA-MM-DD] — título

### Adicionado
### Alterado
### Corrigido
### Removido
### Segurança
### Migrações
### Testes
```
