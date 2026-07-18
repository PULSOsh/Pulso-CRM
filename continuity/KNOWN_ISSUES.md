# Problemas e débitos confirmados

> Atualize somente com evidência do código, banco, logs ou teste reproduzível.

## Baseline histórico de 17/07/2026 (mantido para referência, ver estado real abaixo)

- RBAC por módulo ainda ausente ou parcial. **Corrigido na Fase 1** (17/07) — ver `IMPLEMENTATION_STATUS.md` §11.
- Rotas antigas de CRM e briefings podem coexistir com versões reais ou mockadas. **Corrigido na Fase 2 parte 1** (17/07) — ver `IMPLEMENTATION_STATUS.md` §12.
- Design system tinha tokens/classes não conectados corretamente ao Tailwind. **Corrigido na Fase 0** (17/07).
- Propostas não possuíam fluxo confiável de publicação; rascunho podia mostrar link público inválido. **Ainda não corrigido** — ver item aberto abaixo.
- Contratos foram criados rapidamente e precisam de auditoria funcional e visual. **Funcional, mas interface ainda fora do design system** — ver `IMPLEMENTATION_STATUS.md` §4.1.
- Projetos estavam em working tree e não tinham validação completa de typecheck/build/testes. **Corrigido, módulo funcional** — ver `IMPLEMENTATION_STATUS.md` §4.1.
- Financeiro, arquivos, aprovações, relatórios, notificações e auditoria ainda precisavam ser concluídos. **Ainda ausentes** — schemas prontos, zero código usando (ver `STEP_BY_STEP_IMPLEMENTATION.md` Fases 1, 3, 4, 6, 7).
- Credencial inicial fixa em seed precisava ser removida e rotacionada. **Seed corrigido na Fase 0; rotação da senha já semeada em produção ainda pendente de autorização.**
- `BETTER_AUTH_SECRET` precisava ser persistido corretamente no ambiente de produção. **Ainda não persistido no Dokploy** — reverte a cada redeploy via `docker service update`.

## Itens abertos confirmados em 18/07/2026 (fonte de verdade atual)

```text
ID: KI-001
Título: publicToken de proposta acessível antes de publicar
Evidência: src/server/actions/quotes.ts:116/142 — createQuote gera e grava publicToken na criação
Passos para reproduzir (histórico): criar uma proposta em rascunho; publicToken já existia no banco e getPublicProposal não checava publicAccessEnabled — a proposta ficava 100% visível/aprovável publicamente antes de qualquer publicação (achado real, mais grave do que o texto anterior deste doc sugeria — não era só a UI interna induzindo a erro, a página pública de fato servia o conteúdo)
Impacto: contradiz docs/MODULE_SPECIFICATIONS.md §7
Correção aplicada: getPublicProposal e approveProposal agora exigem publicAccessEnabled === true (coluna já existia no schema, nunca lida); nova action publishQuote(id) flipa a flag. Sem migration. Ver IMPLEMENTATION_STATUS.md §22.
Owner: Claude (Sonnet 5)
Estado: RESOLVIDO em 18/07/2026 (não commitado ainda nesta sessão — ver CURRENT_HANDOFF.md)
Commit/PR: pendente

ID: KI-002
Título: 7 arquivos ainda usam <input>/<select> cru fora de components/ui/*
Evidência: quote-builder-form.tsx, question-editor.tsx, contracts-client.tsx, project-details-client.tsx, projects-client.tsx, question-renderer.tsx (2 ocorrências)
Correção aplicada: quote-builder-form.tsx (4 inputs da tabela de itens), contracts-client.tsx e projects-client.tsx (1 select cada) migrados para Input/Select. question-editor.tsx, project-details-client.tsx e question-renderer.tsx (2×) continuam com input nativo — são radio/checkbox, sem componente Checkbox/Radio em components/ui/ ainda; reclassificado como débito de componente ausente, não de dívida esquecida.
Owner: Claude (Sonnet 5)
Estado: RESOLVIDO em 18/07/2026 para o que tinha alternativa real (não commitado ainda — ver CURRENT_HANDOFF.md)
Commit/PR: pendente

ID: KI-005
Título: Sem componente Checkbox/Radio em components/ui/
Evidência: question-editor.tsx, project-details-client.tsx, question-renderer.tsx (×2) usam <input type="checkbox"|"radio"> nativo por falta de alternativa
Impacto: baixo — estilização manual pontual, não é bug funcional
Correção planejada: criar components/ui/checkbox.tsx e radio.tsx quando houver prioridade (não bloqueia nenhuma fase do STEP_BY_STEP_IMPLEMENTATION.md hoje)
Owner: a definir
Estado: aberto
Commit/PR: —

ID: KI-003
Título: migration 0003_cynical_forgotten_one.sql gerada, não aplicada
Evidência: IMPLEMENTATION_STATUS.md §18/§10 — fix de FK tasks.project_id
Impacto: nenhum em runtime hoje (FK ausente não bloqueia), mas integridade referencial fica sem garantia no banco
Workaround: nenhum
Correção planejada: aplicar após autorização explícita do responsável
Owner: responsável (autorização) + agente (execução)
Estado: aberto, bloqueado em autorização
Commit/PR: —

ID: KI-004
Título: moveOpportunity (drag-and-drop Kanban) — débito de transação já registrado como resolvido; confirmar
Evidência: IMPLEMENTATION_STATUS.md §19 (Grupo 6, commit 4e62471) registra correção — validar se ainda vale citar aqui ou remover
Estado: revisar na próxima auditoria
```

## Regra de atualização

Para cada problema, registrar:

```text
ID:
Título:
Evidência:
Passos para reproduzir:
Impacto:
Workaround:
Correção planejada:
Owner:
Estado:
Commit/PR:
```
