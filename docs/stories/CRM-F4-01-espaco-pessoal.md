# CRM-F4-01 — Espaço pessoal e políticas privadas

Status: Done (implementado 2026-08-05)

## Objetivo

Criar a âncora de privacidade sobre a qual toda a Fase 4 é construída, e corrigir um vazamento real encontrado na auditoria antes de implementar qualquer entidade nova.

## Achado

Auditoria confirmou que `profitability.read_personal`/`manage_personal` já restringem corretamente por papel (só `owner`), com dupla verificação (allow-list explícita + exclusão explícita no `admin`) e sem depender de ocultação de UI. Dois problemas reais foram encontrados:

1. **Risco de design**: a permissão é resolvida por papel, não por usuário. Nada impede tecnicamente que um segundo `organizationMembers` receba o papel `owner` e herde acesso a dados pessoais que não são dele.
2. **Vazamento real confirmado**: `files.ts` (`uploadFile`/`getFilesForEntity`/`getFileVersionHistory`/`getFileDownloadUrl`/`deleteFile`) permite anexar/ler/baixar arquivos vinculados a `entityType: "expense"` verificando só `organizationId`, nunca `expenses.scope`. Qualquer papel com `files.read`/`files.upload` (ex.: `projects`) podia, chamando a action diretamente, acessar anexos de despesas `scope="personal"` sem nunca passar por `profitability.read_personal`/`manage_personal`. Não havia UI que chamasse isso ainda (porta destrancada, não explorada), mas server actions são endpoints RPC chamáveis independentemente de qualquer tela.

## Escopo

- `personal_workspaces` (novo): uma linha por organização, `ownerUserId` fixo. `requirePersonalAccess(mode)` (`services/personal-workspace.ts`) exige as duas coisas: papel certo (`profitability.read_personal`/`manage_personal`) **e** ser exatamente o `ownerUserId` fixado — reaproveitada por toda ação de finanças pessoais da Fase 4.
- `claimPersonalWorkspace()`: o primeiro usuário com papel `owner` a chamar se torna o proprietário fixo; chamadas seguintes de outro usuário são rejeitadas.
- **Correção de segurança**: `files.ts` ganha `assertFileEntityAccess()` — quando `entityType === "expense"` e a despesa tem `scope === "personal"`, exige `requirePersonalAccess()` além da permissão de arquivo já existente. Aplicado nas 5 funções do módulo.

## Fora de escopo

- Interface de transferência de propriedade do espaço pessoal (existe `reassignPersonalWorkspace`, sem UI — uso administrativo direto se necessário).

## Critérios de aceite verificáveis

- Um segundo usuário com papel `owner` que não seja o `ownerUserId` fixado é rejeitado por `requirePersonalAccess`, mesmo tendo a permissão de papel.
- `getFilesForEntity("expense", id)` de uma despesa pessoal falha para quem não tem `profitability.read_personal` E não é o proprietário do espaço pessoal.
- Tipos, testes (incluindo o teste negativo de `isAuthorizedPersonalOwner`, F4-11) e build passam.

## Regras de autorização

Reaproveita `profitability.read_personal`/`profitability.manage_personal` — nenhuma chave nova. A trava adicional é a linha em `personal_workspaces`, não uma permissão.

## Alterações de banco

Tabela `personal_workspaces` (nova), parte de `0012_fase4_financas_pessoais_base.sql`, não aplicada.

## Dev Agent Record

### File List

- `src/server/db/schema/personal-finance.ts` — `personalWorkspaces`.
- `src/server/services/personal-workspace.ts` + `.test.ts` — `requirePersonalAccess`/`isAuthorizedPersonalOwner`.
- `src/server/actions/personal-workspace.ts` — `getPersonalWorkspace`/`claimPersonalWorkspace`/`reassignPersonalWorkspace`.
- `src/server/actions/files.ts` — `assertFileEntityAccess`, aplicado em `uploadFile`/`getFilesForEntity`/`getFileVersionHistory`/`getFileDownloadUrl`/`deleteFile`.

### Completion Notes

`tsc --noEmit`, `vitest run` (180/180), `biome check`, `next build` (35 rotas) — todos verdes. Verificação com dado real não realizada (sem banco neste ambiente) — a lógica de dupla trava foi coberta por teste unitário puro (`isAuthorizedPersonalOwner`), já que não há como simular dois usuários reais sem banco.
