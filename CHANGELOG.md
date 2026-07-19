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

## [2026-07-18] — Correção do crash do Kanban (relação Drizzle ambígua) + padronização de formulários + documentação de continuidade

### Corrigido

- **Crash de produção no Kanban**: `opportunitiesRelations` ganhou `activities: many(activities)` no redesenho anterior, mas `activitiesRelations` nunca declarou a relação inversa (`opportunity: one(opportunities, ...)`). Como `activities` tem três FKs possíveis (oportunidade/empresa/contato), o Drizzle não conseguia inferir sozinho e todo carregamento de `/crm/pipeline` quebrava com "There is not enough information to infer relation opportunities.activities". Diagnosticado via logs reais do container Docker em produção (não foi suposição). Corrigido replicando o padrão já usado em `tasksRelations.opportunity`.
- **Beco sem saída em Projetos**: botão "Gerar Projeto" ficava desabilitado sem explicação quando não havia contrato assinado sem projeto (situação real da produção hoje, com 0 contratos assinados). Adicionada dica visível com link pra Contratos.
- Removido `src/components/briefings/public-briefing-form.tsx` — mock órfão nunca importado em lugar nenhum, não fazia parte do fluxo real de briefing (que usa `BriefingWizard` + `QuestionRenderer`).

### Padronização de formulários

Auditoria encontrou 17 arquivos usando `<input>`/`<select>`/`<button>` cru com Tailwind ad-hoc em vez dos componentes reais de `src/components/ui/` (`Button`, `Input`, `Select`, `Textarea`, `Modal`) — causa raiz de formulários inconsistentes entre telas. Migrados: `contacts-client.tsx`, `companies-client.tsx`, `tasks-client.tsx`, `next-action-form.tsx`, `activity-timeline.tsx`, `kanban-board.tsx` (modal de nova oportunidade + filtros), `project-details-client.tsx`, `projects-client.tsx`, `products/new/page.tsx`, `products/[id]/page.tsx`, `quote-builder-form.tsx`, `question-editor.tsx` (builder de briefing), `question-renderer.tsx` (formulário público de briefing, o único componente de pergunta que é realmente usado).

Deliberadamente **não** migrados: tela de login (`login/page.tsx`) e os modais de assinatura de contrato/aprovação de proposta (`sign-modal.tsx`, `approve-modal.tsx`) — usam uma paleta escura intencional que já bate com o fundo escuro das páginas públicas de proposta/contrato (`docs/DESIGN_SYSTEM.md` §9); os componentes do design system hoje só têm variante clara, então migrá-los quebraria visualmente essas telas.

### Documentação

Depois de uma auditoria pedida pelo responsável ("me diz oq falta"), ficou claro que `docs/MODULE_SPECIFICATIONS.md` e `docs/ARCHITECTURE_AND_STANDARDS.md` já eram completos e corretos — o problema real era a implementação nunca ter seguido até o fim (Propostas, Financeiro, Arquivos, Aprovações, Relatórios, Notificações e Auditoria genérica existem só como schema, sem código usando). Em vez de reescrever os documentos do zero (que o responsável chegou a pedir, mas reconsiderou depois dessa descoberta), foram adicionados:

- `PROMPT_MESTRE.md` — brief consolidado de kickoff pra qualquer sessão futura.
- `STEP_BY_STEP_IMPLEMENTATION.md` — ordem de construção do que falta (Arquivos → Propostas corrigida → Aprovações → Financeiro → Dashboard real → Relatórios → Notificações/Auditoria → Custos), com justificativa de dependência entre módulos.
- `docs/ARCHITECTURE_AND_STANDARDS.md` §11 — armadilhas técnicas reais descobertas nesta sessão (Next 16 async params, relations bidirecionais do Drizzle, CSS cascade layers, técnica de diagnóstico via SSH).
- `docs/DESIGN_SYSTEM.md` §6 — status real dos componentes (já funcionam, o problema era não serem usados) e a regra de nunca usar HTML de formulário cru.
- `IMPLEMENTATION_STATUS.md` §4.1 — raio-x atualizado de estado real por módulo, substituindo a tabela desatualizada de 17/07.

### Testes

- `tsc --noEmit`, `biome check` (arquivos alterados), `vitest run` (31/31), `next build`: todos limpos.

### Débitos conhecidos

- Nenhum novo. Os débitos de Propostas/Financeiro/Arquivos/Aprovações/Relatórios/Notificações/Auditoria já estavam registrados e agora têm ordem de execução em `STEP_BY_STEP_IMPLEMENTATION.md`.

---

## [2026-07-18] — Fase 0 concluída: publicToken de proposta corrigido + formulários restantes + protocolo de continuidade

### Corrigido

- **Bug real de negócio (Propostas)**: `createQuote` sempre gerou `publicToken` na criação (coluna `NOT NULL`/`defaultRandom`), e `getPublicProposal`/`approveProposal` nunca verificavam a flag `publicAccessEnabled` (existente no schema desde sempre, sempre `false` por padrão, nunca lida). Resultado real: qualquer proposta em rascunho era **totalmente visível e aprovável** em `/proposta/{token}` assim que criada, contrariando `docs/MODULE_SPECIFICATIONS.md` §7 ("link público só existe depois de publicar"). Corrigido replicando o padrão já usado e funcional em Contratos (`sendContract`/`getPublicContract`): `getPublicProposal` e `approveProposal` agora exigem `publicAccessEnabled === true`; nova action `publishQuote(id)` (permissão `proposals.publish`, já existia no catálogo, nunca usada) flipa `publicAccessEnabled` + `publishedAt` só quando `status === "draft"`. Nenhuma migration necessária — a coluna já existia, só não era lida. `src/app/crm/quotes/page.tsx` ganhou botão "Publicar" (form + Server Action) para propostas ainda não publicadas.
- **Formulários restantes da Fase 0**: dos 24 arquivos que o CHANGELOG de 18/07 (Kanban crash) listava como auditados, 3 ainda tinham `<input>`/`<select>` cru fora do que é uma exceção legítima:
  - `src/app/crm/quotes/new/quote-builder-form.tsx`: os 4 campos da tabela de itens (descrição, quantidade, valor unitário, desconto) ainda eram `<input>` cru — só os campos de topo (oportunidade, título) tinham sido migrados na sessão anterior. Trocados por `Input` com `className` de override (célula de tabela precisa de padding/altura menores que o padrão de formulário).
  - `src/components/crm/contracts-client.tsx`: `<select>` do modal "Gerar Contrato" nunca tinha sido tocado (arquivo não constava na lista da migração anterior). Trocado por `Select`.
  - `src/components/crm/projects-client.tsx`: mesmo caso, `<select>` do modal "Gerar Projeto". Trocado por `Select`.
  - Confirmado por grep (`<input`/`<select` fora de `components/ui/`, excluindo os já documentados login/sign-modal/approve-modal/app-shell-busca): os únicos `<input>` restantes em `question-editor.tsx`, `project-details-client.tsx` e `question-renderer.tsx` são `type="radio"`/`type="checkbox"` — não há componente `Checkbox`/`Radio` em `components/ui/` ainda, então esses são exceção legítima, não dívida esquecida. Registrado como débito conhecido (não corrigido nesta sessão, fora de escopo).

### Adicionado

- Protocolo formal de continuidade multi-agente instalado neste repositório: `AI_CONTINUITY_PROTOCOL.md`, `CURRENT_HANDOFF.md`, `HISTORY.md`, `continuity/*` (decisões, comandos, problemas conhecidos, checklists de início/fim de sessão), `scripts/capture-handoff.sh` + `verify-continuity.sh`, `prompts/*` (troca entre Claude/Codex/Gemini), `checklists/*` (gate de fase, release, acessibilidade, segurança, módulo concluído). Origem: pacote externo `PULSO_CRM_CONTINUIDADE_TOTAL` (criado por outro agente em 18/07, nunca instalado) — só a camada de protocolo foi trazida; a camada de documentação de produto desse pacote (`docs/*`, `modules/*`, `runbooks/*`, `templates/*`) foi deliberadamente descartada por duplicar/contradizer a documentação já existente e mais atual neste repositório.
- `.claude/launch.json` — configuração do dev server para o preview do Claude Code.

### Testes

- `tsc --noEmit`, `biome check` (arquivos alterados), `vitest run` (31/31), `rm -rf .next && next build` (27 rotas): todos limpos, executados duas vezes (após o fix do publicToken e após os formulários).
- Verificação manual limitada: sem banco disponível nesta sessão (`DATABASE_URL` aponta para `127.0.0.1:5432`, sem túnel/Postgres local ativo — confirmado por erro real `ECONNREFUSED` ao navegar `/proposta/[token]`, não é regressão). Confirmado via navegador: `/crm/quotes` redireciona corretamente para `/login` sem sessão (sem crash). Fluxo completo de publicar→ver proposta pública não foi exercitado com dado real; recomenda-se confirmação do responsável logado antes do próximo passo.

### Débitos conhecidos

- Sem componente `Checkbox`/`Radio` em `components/ui/` — 3 arquivos mantêm `<input type="radio"|"checkbox">` nativo por não ter alternativa (não é regressão, é ausência de componente).
- `publishQuote` não altera `status` (permanece `"draft"` após publicar) nem registra evento/atividade — versionamento completo, eventos (`proposal.published` etc.) e página de detalhe interna continuam sendo o escopo da Fase 2 (`STEP_BY_STEP_IMPLEMENTATION.md`), não desta correção pontual de Fase 0.

---

## [2026-07-18] — Fase 1: módulo de Arquivos (upload/download S3-compatível)

### Adicionado

- `src/server/storage/s3.ts`: cliente S3 (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, instalados nesta sessão), URLs assinadas para download, sem exposição de URL pública direta.
- `src/server/actions/files.ts` + `files.validation.ts`: upload autenticado (`requirePermission("files.upload")`), allowlist de MIME, limite de tamanho (`MAX_UPLOAD_SIZE_MB`), checksum SHA-256, chave de objeto imprevisível prefixada por organização/entidade, exclusão lógica.
- `src/components/ui/file-upload.tsx`, `src/components/crm/files-panel.tsx`: componente de upload no design system + painel reutilizável (lista, upload, download, exclusão com confirmação inline).
- Painel "Arquivos" na tela de detalhe de Oportunidade. Action genérica por `entityType`/`entityId` já suporta as demais entidades listadas em `docs/MODULE_SPECIFICATIONS.md` §10.
- `storedFilesRelations`/`attachmentsRelations` em `src/server/db/schema/relations.ts` (faltavam).

### Testes

- `tsc --noEmit`, `biome check`, `vitest run` (39/39, 8 novos em `files.validation.test.ts`), `next build` (27 rotas): limpos.
- Sem credenciais S3 reais neste ambiente — upload/download real não verificado ponta a ponta, só por leitura de código + tipos + build.

### Débitos conhecidos

- Provisionar bucket S3-compatível real e preencher `S3_*` em produção (decisão de infraestrutura, fora do escopo de um agente).
- Limpeza de arquivos órfãos (`purgeOrphanedFile`) ainda manual, sem job agendado.

---

## [2026-07-18] — Fase 2: Propostas completas (versionamento, detalhe interna, eventos, arquivos públicos)

### Adicionado

- `updateQuoteDraft`/`createNewProposalVersion`/`getQuoteById` em `src/server/actions/quotes.ts`: edição livre de rascunho não publicado; alteração relevante em proposta publicada cria nova versão imutável (bloqueado se já aceita).
- `src/app/crm/quotes/[id]/page.tsx` + `quote-detail-client.tsx`/`quote-content-form.tsx`: página de detalhe interna (não existia).
- Eventos de proposta gravados via `logActivity`: criação, publicação, primeira visualização, nova versão, aceite.
- `isPublic` em `uploadFile` + `getPublicFilesForEntity`: anexos podem ser marcados visíveis na página pública da proposta.

### Corrigido

- `approveProposal` (aceite público) e o update de oportunidade associado agora rodam dentro de uma transação — não estavam, risco real de estado inconsistente se a segunda escrita falhasse.
- Badge de status e exibição do botão de aceite na página pública só reconheciam `status === "draft"`; com o novo status `"viewed"` (setado na primeira visualização), o botão de aceite sumiria depois do primeiro clique real de um cliente.

### Testes

- `tsc --noEmit`, `biome check`, `vitest run` (39/39), `next build` (28 rotas): limpos.
- Sem banco disponível — fluxo completo não exercitado com dado real.

---

## [2026-07-18] — Fase 3: Aprovações (portal público, evidências, rejeição cria tarefa)

### Adicionado

- `src/server/actions/approvals.ts` + `public-approval.ts`: solicitar aprovação a partir de um projeto, portal público (`/aprovacao/[token]`) com aprovar/aprovar com observação/solicitar ajuste, evidências completas (nome/e-mail/comentário/IP/user-agent).
- Rejeição cria `task` real vinculada ao projeto e ao seu responsável.
- `entityType: "approval"` habilitado em `uploadFile`/`getPublicFilesForEntity` (Fase 1) — anexos públicos na página de aprovação.
- Painel "Aprovações" na tela de detalhe de projeto.

### Testes

- `tsc --noEmit`, `biome check`, `vitest run` (39/39), `next build` (29 rotas): limpos.
- Sem banco disponível — fluxo completo não exercitado com dado real.

---

## [2026-07-18] — Fase 4: Financeiro/Recebíveis (geração, baixa, estorno)

### Adicionado

- `src/server/actions/finance.ts`: geração de recebível+parcelas a partir de contrato assinado (transação, validação de soma em centavos), baixa de parcela (fecha o recebível quando quitado), estorno (evento inverso), verificação sob demanda de parcelas vencidas.
- `/crm/financeiro`: rota real substituindo o link morto do menu (indicadores, lista, baixa/estorno inline).
- Contrato assinado ganha ação "Gerar recebível".

### Testes

- `tsc --noEmit`, `biome check`, `vitest run` (39/39), `next build` (30 rotas): limpos.
- Sem banco disponível — não exercitado com dado real.

---

## [2026-07-18] — Fase 5: Dashboard real (fim do mock)

### Adicionado

- `src/server/actions/dashboard.ts`: funil aberto, taxa de conversão 90d, recebido no mês, pendente/vencido, feed de atenção (próxima ação/tarefa/parcela vencida, proposta sem follow-up).

### Removido

- 4 métricas hardcoded (`R$ 34.900`, `31,4%`, etc.) e a data fixa "quinta-feira, 16 de julho" de `src/app/dashboard/page.tsx` — a página nem checava sessão antes.

### Testes

- `tsc --noEmit`, `biome check`, `vitest run` (39/39), `next build` (30 rotas): limpos.

---

## [2026-07-18] — Fase 6: Relatórios (comercial, operacional, financeiro)

### Adicionado

- `src/server/actions/reports.ts`: agregação real no banco (`group by`/`count`/`sum`/`filter`) — primeira vez que o projeto usa esses helpers do Drizzle, em vez do padrão de agregar em JS usado no resto do código.
- `/crm/relatorios`: rota real substituindo o link morto do menu, com filtro de período por URL.

### Testes

- `tsc --noEmit`, `biome check`, `vitest run` (39/39), `next build` (31 rotas): limpos.
- Sem banco disponível — sintaxe SQL conferida por leitura, não executada.

---

## [2026-07-18] — Fase 7: Notificações (in_app) e Auditoria genérica

### Adicionado

- `src/server/services/notify.ts`/`audit-log.ts`: helpers internos (mesmo padrão de `logActivity`), gravam `notifications`/`audit_logs` reais.
- `src/server/actions/notifications.ts`: listar, contar não lidas, marcar lida(s).
- Wired em: aceite de proposta, assinatura de contrato, decisão de aprovação, baixa/estorno de parcela.
- Sino "Notificações" novo na topbar, separado do sino de pendências vencidas já existente.

### Corrigido

- `signContractPublic` não estava em transação (mesmo gap que `approveProposal` tinha antes da Fase 2) — corrigido de passagem.

### Testes

- `tsc --noEmit`, `biome check`, `vitest run` (39/39), `next build` (31 rotas): limpos.

---

## [2026-07-18] — Fase 8: Custos e lucratividade (schema novo, fórmulas testadas)

### Adicionado

- `src/server/db/schema/costs.ts`: `expenseCategories`/`expenses`/`financialSettings` — único schema novo desta sessão (todas as fases anteriores reusaram tabelas já existentes). Migration `0004_warm_spyke.sql` gerada, **não aplicada**.
- `src/server/services/profitability.ts` + `profitability.test.ts`: 12 fórmulas puras, 20 testes unitários (custo fixo, margem, ponto de equilíbrio, metas, runway, valor-hora mínimo, etc.).
- `src/server/actions/profitability.ts` + `/crm/lucratividade`: dados empresariais (`profitability.read_business`) e pessoais (`profitability.read_personal`, exclusivo do papel `owner`) separados por permissão real, não por UI.

### Testes

- `tsc --noEmit`, `biome check`, `vitest run` (59/59, 20 novos), `next build` (32 rotas): limpos.
- Migration gerada e conferida por leitura do SQL, não aplicada em nenhum ambiente — precisa de autorização explícita antes de tocar produção.

---

## [2026-07-18] — Validação de design contra PREVIEWS/PROTOTIPO

### Corrigido

- **Crítico**: 12 páginas de `/crm/*` (incluindo o Kanban principal) renderizavam sem `AppShell` — sem sidebar nem topbar em produção. Todas corrigidas: `crm/pipeline`, `crm/quotes` (lista/novo/detalhe), `crm/opportunities/[id]`, `crm/products` (lista/novo/[id]), `crm/briefings/inbox` (lista/[id]), `crm/briefings/templates` (lista/[id]). `app-shell.tsx` ganhou `"products"`/`"profitability"` no union `ActiveKey`.
- `proposta/[token]`, `contrato/[token]`, `aprovacao/[token]` + seus modais (`approve-modal.tsx`, `sign-modal.tsx`, `decide-modal.tsx`): tema escuro sem base na referência trocado pelo tema claro/creme com seções de contraste já definido em `globals.css` (`.public-proposal`, `.proposal-hero`, `.proposal-dark-section`, `.investment-section`).
- `solicitar/[slug]`, `briefing-wizard.tsx`, `solicitar/[slug]/sucesso`: card branco genérico trocado por `.public-briefing-layout`/`.public-form-panel`/`.public-success`.
- `inbox-list.tsx`: tabela reescrita com `.briefing-table`/`.briefing-row`/`.status-pill`.

### Alterado

- `crm/quotes/new/quote-builder-form.tsx`: reescrito de formulário Tailwind genérico de coluna única para o layout de duas colunas com prévia ao vivo de `gerador_orcamento.png` (`.proposal-builder-layout`, `.builder-card`, `.source-options`, `.proposal-item-row`, `.totals-box`, `.proposal-preview-card`, `.mini-proposal`). "Salvar rascunho"/"Publicar" agora redirecionam para `/crm/quotes/[id]` (antes não davam feedback nenhum de sucesso).
- `getPublicProposal` (`public-quote.ts`): ganhou `preparedForName`/`preparedForContact` pro card "Preparada para" da proposta pública.

### Débitos

- Seletor "Origem dos dados" do gerador de orçamento mostra oportunidade/briefing/manual como no mockup, mas só "oportunidade" é funcional — as outras duas ficam desabilitadas ("Em breve") porque `createQuote` exige `opportunityId` obrigatório; importar de briefing ou criar sem oportunidade é mudança de schema/backend fora do escopo desta validação de design.
- Botão "Visualizar" do gerador de orçamento fica desabilitado antes do primeiro rascunho salvo (não há nada pra visualizar ainda).
- Verificação visual real (screenshot/clique autenticado) das 12 páginas com `AppShell` e do `/crm/quotes/new` novo não foi feita nesta sessão — sem credenciais de admin disponíveis no checkout local. Só validação estática (`tsc`/`biome`/`vitest`/`build`).

### Testes

- `tsc --noEmit`, `biome check --write`, `vitest run` (59/59), `rm -rf .next && next build` (32 rotas): limpos.

---

## [2026-07-19] — Push, deploy e migrations 0003/0004 aplicadas em produção

### Alterado

- `git push origin main` (`386e854..38ee25d`, fast-forward, 11 commits). Dokploy reconstruiu e subiu o container automaticamente via webhook.

### Migrações

- Aplicadas em produção via `drizzle-kit migrate` por túnel SSH: `0003_cynical_forgotten_one.sql` (FK `tasks.project_id → projects.id`) e `0004_warm_spyke.sql` (tabelas `expense_categories`/`expenses`/`financial_settings`). A `0003` estava pendente desde a Fase 7 — não só a `0004` como o relatório da Fase 8 tinha registrado.
- Backup `pg_dump -F c` do banco `pulsodb` feito antes de qualquer alteração (host da VPS + cópia local em `PULSO_CRM_V2/backups/`).
- Verificado sem linha órfã em `tasks.project_id` antes da FK; tabelas novas e constraint confirmadas depois via `information_schema`/`pg_constraint`.

### Testes

- `/api/health`: 200. `/crm/lucratividade` sem sessão: 200 (redirect pro login, sem 500). Logs do serviço sem erro nos 10 min após o deploy.

### Débitos

- Backup foi pontual/manual, não rotina automatizada com retenção testada (pendente, `production-safety.md` §6).
- `BETTER_AUTH_SECRET` continua fraco (débito pré-existente, não resolvido nesta sessão).

---

## [2026-07-19] — Contratos no design system, produto/diagnóstico na oportunidade, validação Zod em create*

### Adicionado

- `updateOpportunity`, `addOpportunityProduct`, `removeOpportunityProduct` (`pipeline.ts` + novo `pipeline.schemas.ts`) — oportunidade não tinha nenhuma forma de editar depois de criada; diagnóstico, valor negociado, probabilidade, previsão de fechamento e produto vinculado existiam no schema sem UI nenhuma.
- `opportunity-negotiation-form.tsx` e `opportunity-products-panel.tsx` em `crm/opportunities/[id]`.

### Alterado

- `contracts-client.tsx`, `contract-details-client.tsx`, `generate-receivable-form.tsx`: Tailwind cru trocado pelas classes reais do design system (`.briefing-table`, `.status-pill` com 5 variantes novas em `globals.css`, `.builder-card`, `.field`, `.primary-button`/`.secondary-button`). Motivo de cancelamento de contrato deixou de usar `window.prompt()` nativo.
- `createContact`/`createCompany` agora validam com Zod (reaproveitando `updateContactSchema`/`updateCompanySchema`, mesmo formato de dados entre criar e editar).

### Testes

- `tsc --noEmit`, `biome check --write`, `vitest run` (59/59), `rm -rf .next && next build` (32 rotas): limpos.

### Débitos

- Resto da página de detalhe da oportunidade continua em Tailwind cru fora dos dois componentes novos (consistência local escolhida deliberadamente; falta uma rodada dedicada).
- "Configurações"/gestão de papéis continua link morto.

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
