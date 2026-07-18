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

## [2026-07-18] — Fase 3 (parte 1, continuação): 6 fatias além dos 4 grupos originais

### Adicionado

- `moveOpportunity` (Kanban) agora usa transação, igual ganho/perda.
- Linha do tempo de atividades: auto-registrada em próxima ação/ganho/perda/mudança de etapa/tarefa vinculada, mais nota manual.
- Contato vinculado a empresa (`company_contacts`, morta desde sempre).
- Restaurar contato/empresa excluído (permissões já existiam, sem ação).
- Painel de vínculos (briefing/proposta/contrato/projeto) na tela de oportunidade.
- Temperatura e responsável visíveis no card do Kanban.

### Testes

- `tsc --noEmit`, `npm run lint`, `vitest run` (31 testes), `next build`: verdes em cada fatia.
- Mesma técnica de rota de preview temporária (sem sessão, deletada antes do commit) pra confirmar a fiação de cada ação nova.

### Nota de metodologia

Um clique em fluxo com `window.alert()` travou a automação de navegador usada pra verificar (nativo, não um bug do app) — recuperado apertando Enter. Registrado como lição pra preferir estado de erro inline em vez de `alert()`/`confirm()` em telas novas, quando possível.

### Pendências

- 11 commits locais no total (Fase 3 completa), nada enviado ao GitHub.
- Migration da FK de `tasks.project_id` ainda não aplicada.

---

## [2026-07-18] — Correção crítica: params/searchParams assíncronos (Next.js 16)

### Corrigido

- Bug sistêmico pré-existente (não introduzido nesta sessão): todas as 10 rotas dinâmicas do app liam `params`/`searchParams` de forma síncrona, mas no Next.js 16 esses valores são `Promise` e precisam de `await`. Isso derrubava com `UNDEFINED_VALUE: Undefined values are not allowed` assim que qualquer rota dinâmica fosse acessada — inclusive páginas públicas voltadas ao cliente (assinatura de contrato, aprovação de proposta, formulário de briefing).
- Reportado pelo usuário via crash real na tela de detalhe de oportunidade (digest `3086529012`); diagnosticado lendo os logs reais do container Docker em produção via SSH, não por suposição.
- Arquivos corrigidos: `src/app/crm/opportunities/[id]/page.tsx`, `src/app/crm/briefings/inbox/[id]/page.tsx`, `src/app/crm/briefings/templates/[id]/page.tsx`, `src/app/crm/contratos/[id]/page.tsx`, `src/app/crm/products/[id]/page.tsx` (incluindo a closure `"use server"` interna), `src/app/crm/projetos/[id]/page.tsx`, `src/app/contrato/[token]/page.tsx`, `src/app/proposta/[token]/page.tsx`, `src/app/solicitar/[slug]/page.tsx`, `src/app/solicitar/[slug]/sucesso/page.tsx`.

### Testes

- `tsc --noEmit`: limpo.
- `biome check` nos 10 arquivos alterados: limpo (após `--write` para formatação).
- `vitest run`: 31/31 testes passando.
- `next build` (build limpo, `.next` removido antes): sucesso, todas as 10 rotas dinâmicas compilando e presentes na tabela de rotas.

### Impacto em produção

- Bug estava ativo em produção antes desta correção — qualquer clique em uma rota dinâmica (interna ou pública) resultava em erro 500. Correção pronta para deploy mediante autorização explícita.

---

## [2026-07-18] — Redesenho do Kanban/funil para bater com a referência visual aprovada

### Contexto

Depois do push da correção crítica de `params`, o responsável testou e reportou que "a tela de funil kanban não tá certa, tá diferente do proposto", com uma imagem de referência mostrando o layout esperado: abas de funil, barra de estatísticas, tags de produto nos cards, temperatura como dot+label, contagem de atividades/tarefas por card, subtotal de valor por coluna, badges de contagem no menu lateral, e busca/alertas no topo.

Antes de construir, perguntei ao responsável sobre 4 pontos ambíguos do mockup (removeria "Briefings" do menu? implementaria "Restaurar demonstração"? construiria funil "Parcerias" real? o que representam os 2 ícones com número no card?) — todas as respostas foram pelas opções recomendadas: manter Briefings no menu, não implementar reset de demonstração (risco de perda de dado real), só o funil "Comercial" funcional por enquanto (aba "Parcerias" e "+" desabilitadas com tooltip "em breve"), e os dois ícones representam contagem de atividades e de tarefas abertas (dados já existentes desde os Grupos 3 e 5 da Fase 3).

### Adicionado

- `opportunitiesRelations` ganhou `activities`, `tasks` e `opportunityProducts` (many); nova relation `opportunityProductsRelations` (produto/oportunidade) — necessário pra Drizzle permitir contagens via `with:`.
- `getPipelineWithOpportunities()` agora retorna, por oportunidade: `activitiesCount`, `openTasksCount` (status `todo`), `productName` (primeiro produto vinculado via `opportunity_products`, ou `null` se nenhum — não há UI ainda pra vincular produto, débito já registrado na seção 19). Por etapa: `valueTotal` (soma do valor estimado). No geral: `summary` (contagem de oportunidades abertas, valor do funil, previsão ponderada = valor × probabilidade da oportunidade ou da etapa).
- Nova `src/server/actions/nav.ts`: `getNavBadgeCounts()` (oportunidades abertas, propostas aguardando resposta `sent`/`viewed`, tarefas pendentes do usuário atual) e `getOverdueAlerts()` (próximas ações e tarefas vencidas, para o sino de alertas).
- Kanban card (`kanban-card.tsx`) redesenhado: tag de produto no topo, temperatura como dot colorido + label, preço com separador, próxima ação com ícone de urgência (alerta se vencida, seta se não), contagem de atividades/tarefas no rodapé. Cartão inteiro virou a alça de arrastar (o `PointerSensor` já tinha `activationConstraint` de 5px, então clique continua abrindo o link normalmente).
- Coluna do Kanban (`kanban-column.tsx`): subtotal de valor exibido abaixo do cabeçalho.
- Board do Kanban (`kanban-board.tsx`): abas "Comercial" (funcional) / "Parcerias" (desabilitada) / "+" (desabilitada); barra de estatísticas (contagem, valor do funil, previsão ponderada); filtros reais de temperatura e responsável + ordenação (ordem do funil, maior valor, próxima ação) — implementados como `<select>` simples em vez do botão+painel do mockup, pra não construir um painel de filtro inteiro sem necessidade comprovada.
- Menu lateral (`app-shell.tsx`): badges de contagem reais em "Funil (Kanban)", "Orçamentos" e "Tarefas", buscados via `getNavBadgeCounts()`.
- Topbar: busca restilizada com ícone de lupa e atalho visual "⌘ K" (só visual, sem o atalho de teclado real ainda); sino de alertas com contagem de pendências vencidas e dropdown listando as 5 mais urgentes de cada tipo, usando `getOverdueAlerts()`.

### Não implementado (decisão do responsável)

- Botão "Restaurar demonstração": risco de perda de dado real, fora das regras do CLAUDE.md — não construído.
- Funil "Parcerias" e botão "+" de criar funil: schema já suporta múltiplos `pipelines`, mas nenhuma lógica de seleção/criação foi construída agora — abas ficam visíveis mas desabilitadas.
- Alternador de tema claro/escuro do mockup: não há sistema de tokens dark no design system atual; construir um do zero era escopo maior que o pedido. Não implementado, registrado como débito.
- Atalho de teclado real para "⌘ K" focar a busca: só o indicador visual foi implementado.

### Testes

- `tsc --noEmit`: limpo.
- `biome check` nos arquivos alterados: limpo (após `--write` para formatação).
- `vitest run`: 31/31 testes passando.
- `next build` (build limpo, `.next` removido antes): sucesso.
- Verificação visual: rota temporária `/dev-shell-preview` (sem sessão, deletada antes do commit) renderizando `KanbanBoard` com dados simulados batendo com os números do mockup (12 oportunidades, R$ 36.194, R$ 15.380). Conferido via árvore de acessibilidade (`read_page`) e extração de texto (`get_page_text`) — confirma estrutura, tags, temperatura, preços, próxima ação, iniciais do responsável e contagens todos presentes e corretos. A ferramenta de screenshot do navegador de testes deu timeout repetido por motivo de ambiente (não relacionado ao código — o único erro real encontrado no console foi um mismatch de hidratação de ids internos do `dnd-kit`, artefato conhecido e inofensivo do Fast Refresh em dev, pré-existente à este redesenho).

### Débitos conhecidos

- Produto vinculado à oportunidade continua sem UI de criação (só leitura, se já existir o vínculo) — tag de produto no card ficará vazia pra toda oportunidade real até essa UI existir.
- Filtro/ordenação são só client-side sobre os dados já carregados (sem paginação nem busca no servidor) — aceitável pro volume atual.
- Owner do card em `select` de filtro usa apenas nomes distintos presentes no funil carregado, não a lista completa de usuários da organização.

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
