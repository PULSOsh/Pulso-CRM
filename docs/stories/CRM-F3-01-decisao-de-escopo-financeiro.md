# CRM-F3-01 — Decisão de escopo financeiro empresarial

Status: Done (decidido e implementado 2026-08-05)

## Objetivo

Resolver, antes de desenhar qualquer tabela nova, a contradição entre o plano mestre (F3-01 pede um "workspace financeiro empresarial") e o `CLAUDE.md` do projeto (proíbe explicitamente qualquer construção multi-workspace/multiempresa - single-organization fixo).

## Achado

Não existe hoje nenhuma tabela ou entidade chamada "workspace" no schema - as únicas ocorrências da palavra no código são comentários usando "workspace" como sinônimo informal de `organizationId`. O único precedente real de isolamento diferente de `organizationId` é o enum `scope` (`personal|business|project`) em `expenses`/`expense_categories`, que já resolve separação de dados sem precisar de uma tabela de workspace dedicada.

## Decisão (confirmada com o responsável via pergunta direta)

"Workspace financeiro empresarial" = o módulo/escopo `business` dentro da única organização, não uma tabela nova. Toda tabela nova da Fase 3 carrega `organizationId` normal (mesmo padrão de `receivables`/`expenses`), sem isolamento extra. Nenhuma tabela `financial_workspaces` foi criada.

## Por que isso importa para o resto da fase

Essa decisão é a fundação de todo o schema da Fase 3 (F3-02 a F3-12): todas as tabelas novas (`payables`, `financial_transactions`, `cost_centers`, etc.) seguem o padrão single-tenant já estabelecido, sem seletor de workspace, sem onboarding de organização, sem convites entre empresas - exatamente como o `CLAUDE.md` exige.

## Dev Agent Record

### Completion Notes

Decisão registrada aqui em vez de código, porque o resultado é justamente a ausência de uma tabela/entidade nova - qualquer "implementação" seria construir o que foi decidido não construir.
