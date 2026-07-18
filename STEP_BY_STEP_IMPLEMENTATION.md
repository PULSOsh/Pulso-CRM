# PASSO A PASSO — o que falta construir no PULSO CRM

> Este documento não repete o que já está em `docs/MODULE_SPECIFICATIONS.md` — ele diz **em que ordem** construir o que falta, e por quê essa ordem. A especificação de cada módulo (campos, estados, regras) já existe e está correta; o que faltava era isso aqui: um plano executável.
>
> Ver `IMPLEMENTATION_STATUS.md` §4.1 pra saber exatamente o que já é real hoje antes de começar qualquer fase.

## Por que esta ordem

Módulos que outros módulos referenciam (Arquivos, por exemplo — Propostas, Projetos e Aprovações todos mostram "arquivos") vêm antes de quem os referencia. Bugs conhecidos em produção vêm antes de módulo novo, porque deixar um bug de segurança/negócio conhecido (proposta pública visível antes de aprovar) enquanto se constrói feature nova é priorizar o errado. Módulos que dependem de dado real de outros módulos (Dashboard, Relatórios) vêm por último, porque sem dado real eles só mostrariam mock — e "não usar mock como resultado final" é proibição do `CLAUDE.md`.

## Fase 0 — Fechar o que já está em andamento

Antes de abrir módulo novo, terminar o que já está pela metade:

1. **Padronização de formulários** (`docs/DESIGN_SYSTEM.md` §6) — trocar `<input>`/`<select>`/`<button>` cru pelos componentes reais em todos os arquivos que ainda usam HTML cru. Checar quais arquivos restam com `grep -rn "<input\|<select" src/app src/components --include="*.tsx" | grep -v "components/ui/"`.
2. **Bug de proposta pública antes de publicar** (`IMPLEMENTATION_STATUS.md` §4.1) — `createQuote` não deveria gerar `publicToken` acessível antes de uma etapa explícita de publicação. Corrigir isso é rápido e resolve um problema de negócio real (cliente vendo proposta rascunho) antes de expandir o módulo de Propostas.

## Fase 1 — Arquivos

Por quê primeiro: Propostas, Aprovações e Projetos todos precisam mostrar/anexar arquivo. Construir depois faria retrabalho em três módulos.

Especificação: `docs/MODULE_SPECIFICATIONS.md` §10. Schema já existe (`src/server/db/schema/files.ts`).

Entregar:
- upload autenticado (server action + endpoint de storage S3-compatível, variáveis `S3_*` já documentadas em `docs/ARCHITECTURE_AND_STANDARDS.md` §10);
- URL temporária assinada pra download, nunca URL pública direta;
- componente `FileUpload` em `components/ui/` (não existe ainda);
- vínculo com as entidades já especificadas (contato, empresa, oportunidade, briefing, proposta, contrato, projeto);
- exclusão lógica, sem apagar objeto do storage sem confirmação.

Critério de aceite: conseguir anexar um arquivo a uma oportunidade e baixar de volta, com permissão checada no servidor.

## Fase 2 — Propostas (completar e corrigir)

Por quê agora: já existe base funcional (criar rascunho, itens, cálculo); falta fechar exatamente o que `docs/MODULE_SPECIFICATIONS.md` §7 já especifica, e é o próximo elo direto da venda depois do que já funciona (Kanban → oportunidade → proposta → contrato, e Contrato já funciona).

Entregar, nesta ordem:
1. Ação de **publicar** separada de salvar rascunho — só depois de publicar o `publicToken` fica ativo.
2. Versionamento real: alteração relevante em proposta publicada cria nova `proposalVersion`, a antiga fica congelada.
3. Página de detalhe interna (`/crm/quotes/[id]`) — hoje só existe lista e criação.
4. Eventos da lista em §7 (`proposal.published`, `proposal.sent`, `proposal.viewed` etc.) gravados como atividade, reaproveitando `src/server/services/activity-log.ts` que já existe.
5. Anexar arquivos públicos da Fase 1 na página pública da proposta.

Critério de aceite: um rascunho não é acessível por link público; publicar cria uma versão imutável; o cliente só vê o que a spec de "página pública" permite (sem custo, margem, nota interna).

## Fase 3 — Aprovações

Por quê agora: depende de Arquivos (Fase 1) pra mostrar preview/anexo, e fecha o elo entre Projeto e entrega que `docs/PRODUCT_VISION.md` já descreve no fluxo principal.

Especificação: `docs/MODULE_SPECIFICATIONS.md` §11. Schema e permissões já existem (`approvals`, `approvals.read/create/decide`), zero código usando ainda.

Entregar: fluxo de solicitar aprovação a partir de um projeto, página pública de aprovação (token, decisão, comentário), rejeição cria tarefa automaticamente (reaproveitar o padrão de `logActivity`/criação de tarefa que já existe em outros módulos).

## Fase 4 — Financeiro / Recebíveis

Por quê agora: depende de Contrato (já funcional) pra gerar o recebível, e é o próximo elo do fluxo principal (contrato → recebível → parcela → baixa).

Especificação: `docs/MODULE_SPECIFICATIONS.md` §12. Schema já existe (`src/server/db/schema/finance.ts`), zero código usando.

Entregar, nesta ordem:
1. Geração de recebível e parcelas a partir de um contrato assinado (transação, igual ao padrão já usado em `createProjectFromContract`).
2. Baixa de parcela (paga/atrasada), sempre com `numeric` pra dinheiro, nunca `float` (regra já em `docs/ARCHITECTURE_AND_STANDARDS.md` §7).
3. Interface interna: lista de recebíveis, baixa, comprovante (usa o `FileUpload` da Fase 1).
4. Job (ou verificação sob demanda, como já fazemos com `getOverdueAlerts`) que atualiza `overdue` de parcelas vencidas.

Critério de aceite: assinar um contrato gera recebível e parcelas reais; dar baixa registra usuário, data e valor; parcela paga nunca é apagada, só ajustada com evento.

## Fase 5 — Dashboard real

Por quê só agora: um dashboard de atenção só faz sentido com dado real de próxima ação, tarefa, proposta parada e parcela vencida — que só existem de verdade a partir daqui. Construir antes seria mock, proibido pelo `CLAUDE.md`.

Especificação: `docs/MODULE_SPECIFICATIONS.md` §14 (seção "Atenção").

Entregar: substituir `src/app/dashboard/page.tsx` (hoje 100% mock) por queries reais reaproveitando o que já existe (`getOverdueAlerts` de `src/server/actions/nav.ts`, expandido pra incluir proposta sem follow-up e parcela vencida da Fase 4).

## Fase 6 — Relatórios

Depende de dado real de todos os módulos anteriores. Especificação: `docs/MODULE_SPECIFICATIONS.md` §14 (seções de relatório comercial/operacional/financeiro). Regra obrigatória: agregação no banco, nunca cálculo completo no cliente.

## Fase 7 — Notificações e Auditoria genérica

Cross-cutting, podem ser construídos em paralelo com qualquer fase anterior a partir da Fase 2, mas não bloqueiam nada — por isso ficam por último na ordem de prioridade, não por serem descartáveis. Notificações: começar só por canal `in_app`, especificação em §14 do vision doc (não expandir pra e-mail/WhatsApp sem necessidade comprovada). Auditoria genérica: escrever em `audit_logs` nas mesmas transações que já escrevem em `activities`/`contractEvents`, reaproveitando o padrão de service já estabelecido (`logActivity`).

## Fase 8 — Custos e lucratividade

Último por ser o mais sensível (dado financeiro pessoal do fundador) e por depender de Financeiro (Fase 4) já estar sólido. Especificação: `docs/MODULE_SPECIFICATIONS.md` §13. Não iniciar sem confirmação explícita do responsável, dado o nível de confidencialidade descrito na spec.

## Regra de execução, todas as fases

Para cada fase: schema/migration → validação (Zod) → repository/service → autorização (`requirePermission`, seguindo o catálogo já existente em `docs/ARCHITECTURE_AND_STANDARDS.md` §6) → interface com componentes do design system real → teste → `tsc`/`biome`/`vitest`/`build` reais executados → documentação atualizada → commit coeso → só push/deploy com autorização explícita. Isso já está no `CLAUDE.md` §6 — repetido aqui só pra deixar claro que vale pra cada fase deste plano, sem exceção.
