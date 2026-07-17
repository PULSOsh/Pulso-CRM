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
| Usuários e papéis | Parcial/ausente | Sem RBAC completo por módulo |
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

- **RBAC ausente**: nenhuma constante de papel/permissão existe no código; qualquer usuário autenticado tem acesso total.
- **Nenhuma server action valida sessão ou papel internamente.** Toda action recebe `organizationId` como parâmetro simples vindo da página chamadora; a própria action nunca confere se esse valor bate com a sessão real, nem confere se existe sessão. Únicas exceções parciais: `createCompany`/`createContact` checam `if (!session) throw`, mas não validam que o `organizationId` recebido é o da sessão. **Isso é exatamente o padrão que `CLAUDE.md` proíbe** ("confiar em `organization_id` enviado pelo cliente"). Hoje o risco prático é baixo (existe apenas 1 organização), mas o código está estruturalmente inseguro para quando isso deixar de ser verdade. Arquivos afetados: `pipeline.ts`, `products.ts`, `quotes.ts`, `public-quote.ts`, `contracts.ts`, `projects.ts`, `briefing-templates.ts`, `briefing-submissions.ts`, `organization.ts` — 0 chamadas a `auth.api.getSession` em nenhum deles.
- **Rotas antigas com mock coexistem com rotas reais**: `/crm` (usa `components/crm/kanban-board.tsx` + `src/data/opportunities.ts`) e `/briefings` (usa `components/briefings/briefing-inbox.tsx` + dado mockado) continuam no ar ao lado de `/crm/pipeline` e `/crm/briefings/inbox`, que são as versões reais.
- **Nav com links mortos**: Tarefas, Financeiro, Relatórios e Configurações apontam para `href="#"`.
- **Design system não funciona na base** (achado e parcialmente corrigido nesta sessão): `components/ui/*` (Button, Card, Badge, Modal, Input, Select, Textarea) usa classes Tailwind (`bg-pulso-signal`, `rounded-card`, `duration-base`...) que nunca foram registradas via `@theme`. Corrigido agora (`globals.css`), mas **zero arquivos no projeto importam esses componentes** — cada tela usa Tailwind cru independente. 8 arquivos usam classes arbitrárias em colchetes (`shadow-[...]` etc).
- **Link público de proposta aparece antes do estado correto**: `publicToken` é gravado na criação da proposta (antes de qualquer publicação), então a lista de orçamentos já mostra "Ver Proposta" para rascunhos, que dá 404 na página pública — comportamento correto do lado da página pública (não vaza rascunho), mas a UI interna induz ao erro.
- **Contratos e projetos foram acelerados sem gate de qualidade**: ambos compilam e passam nos testes existentes, mas foram construídos com Tailwind cru (não os tokens Pulso) e sem teste de aceite formal.
- Ausência de testes significativos (2 testes triviais, inalterado).
- Financeiro, tarefas, arquivos, aprovações e relatórios: ausentes.

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

**Fase 0 concluída nesta sessão.** Critérios de saída do Roadmap ("nenhum dado perdido, nenhum segredo fixo e estado real documentado") atendidos, com uma ressalva: a senha administrativa já semeada em produção ainda não foi rotacionada (requer autorização explícita, é alteração de dado de produção).

Não avançar para Fase 1 sem decisão do responsável sobre a ordem: o Roadmap sugere Fase 1 (workspace/RBAC/autorização) antes de qualquer outra coisa, dado o achado da seção 6.

## 10. Próxima ação exata

Iniciar Fase 1 (`docs/ROADMAP.md`): criar o helper central de autorização (`requirePermission`), papéis tipados (owner/admin/commercial/projects/finance/viewer) e aplicar validação de sessão + papel dentro de cada server action listada na seção 6 — não apenas na página que a chama. Antes disso, obter autorização explícita para rotacionar a senha administrativa de produção.
