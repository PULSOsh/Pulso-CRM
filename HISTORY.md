# PULSO CRM — Histórico permanente de execução

> **Append-only:** nunca apague nem reescreva entradas antigas. Correções devem ser novas entradas referenciando a anterior.

## Nota sobre histórico anterior a esta data

Este arquivo (`HISTORY.md`) só passou a existir neste repositório em 2026-07-18, quando o protocolo formal de continuidade multi-agente foi instalado (ver entrada abaixo). O histórico de execução **anterior** a essa data — Fase 0 (auditoria/segurança), Fase 1 (RBAC), Fase 2 (design system, parcial) e Fase 3 (CRM operacional, 10 grupos) — está registrado com riqueza de detalhe em `IMPLEMENTATION_STATUS.md`, seções 3 e 11 a 21. Leia esse arquivo para o histórico completo antes de assumir que o projeto começou aqui.

## Como registrar

Cada sessão que alterar código, banco, migrations, documentação de fonte de verdade ou decisões estruturais deve adicionar uma entrada no topo da seção de entradas, usando o template abaixo.

Não registre segredos, senhas, tokens, documentos pessoais, dumps ou dados reais de clientes.

---

## Entradas

### 2026-07-18 — Continuidade instalada + Fase 0 concluída (publicToken de propostas + formulários restantes)

- Agente: Claude (Sonnet 5)
- Branch: `main`
- Commit inicial: `386e854`
- Commit final: nenhum ainda — mudanças no working tree, aguardando revisão do responsável antes de commitar (ver `CURRENT_HANDOFF.md`)
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
