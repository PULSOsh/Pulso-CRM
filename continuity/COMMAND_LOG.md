# Registro de comandos executados

> Somente comandos realmente executados. Não cole segredos nem saídas com dados sensíveis.

| Data/hora | Agente | Ambiente | Comando | Exit code | Resultado resumido | Snapshot |
|---|---|---|---|---:|---|---|
| 2026-07-18 | ChatGPT | documentação | validação do pacote | 0 | arquivos e ZIP verificados | não se aplica |
| 2026-07-18 | Claude | local | `git status --short --branch` | 0 | `## main...origin/main`, limpo | não se aplica |
| 2026-07-18 | Claude | local | `git log --oneline --decorate -15` | 0 | HEAD `386e854`, histórico conferido | não se aplica |
| 2026-07-18 | Claude | local | `git rev-list --left-right --count main...origin/main` | 0 | `0 0` — nada pendente de push | não se aplica |
| 2026-07-18 | Claude | local | `grep -rln "<input\|<select" src/app src/components --include="*.tsx" \| grep -v components/ui/` | 0 | 10 arquivos (7 reais após exceções conhecidas) | não se aplica |
| 2026-07-18 | Claude | local | `grep -n publicToken src/server/actions/quotes.ts` | 0 | confirma bug (linhas 116/142) | não se aplica |
| 2026-07-18 | Claude | local | `npx tsc --noEmit` (após fix publicToken) | 0 | limpo | não se aplica |
| 2026-07-18 | Claude | local | `npx biome check` (3 arquivos do fix) | 0 | limpo | não se aplica |
| 2026-07-18 | Claude | local | `npx vitest run` (após fix publicToken) | 0 | 31/31 passando | não se aplica |
| 2026-07-18 | Claude | local | `rm -rf .next && npx next build` (após fix publicToken) | 0 | verde, 27 rotas | não se aplica |
| 2026-07-18 | Claude | local | preview local `/crm/quotes` sem sessão | — | redireciona para `/login`, sem crash | não se aplica |
| 2026-07-18 | Claude | local | preview local `/proposta/00000000-...` | 500 | `ECONNREFUSED 127.0.0.1:5432` — sem banco disponível nesta sessão, não é bug do código | não se aplica |
| 2026-07-18 | Claude | local | `grep -rn "<input\|<select" src/app src/components --include="*.tsx" \| grep -v components/ui/` (após formulários) | 0 | só exceções conhecidas restantes | não se aplica |
| 2026-07-18 | Claude | local | `npx tsc --noEmit` (após formulários) | 0 | limpo | não se aplica |
| 2026-07-18 | Claude | local | `npx biome check` (3 arquivos dos formulários) | 0 | limpo | não se aplica |
| 2026-07-18 | Claude | local | `npx vitest run` (após formulários) | 0 | 31/31 passando | não se aplica |
| 2026-07-18 | Claude | local | `rm -rf .next && npx next build` (após formulários) | 0 | verde, 27 rotas | não se aplica |

## Regras

- Registre `lint`, `typecheck`, testes, build, migrations e deploy.
- Falha também deve ser registrada.
- “Não executado” é melhor que uma aprovação inventada.
- Para logs extensos, salve referência ao arquivo ou snapshot, sem colar credenciais.
