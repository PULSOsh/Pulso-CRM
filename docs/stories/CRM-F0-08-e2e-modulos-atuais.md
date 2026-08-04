# CRM-F0-08 — E2E dos módulos atuais

Status: Done (primeiro lote — infraestrutura + specs reais e executados; fluxo crítico completo ainda pendente de organização/usuário de teste)

## Objetivo

Configurar a infraestrutura de E2E do projeto (`docs/QUALITY_AND_ACCEPTANCE.md` §8 já especifica Playwright e o script `test:e2e`, nunca instalado) e entregar o primeiro lote de specs reais, executados de fato — não só escritos.

## Contexto atual confirmado

- `docs/ARCHITECTURE_AND_STANDARDS.md` e `docs/QUALITY_AND_ACCEPTANCE.md` já especificam Playwright como a ferramenta ("test:e2e": "playwright test") — não era uma decisão a tomar, só a implementar.
- Nenhum `.env`/`DATABASE_URL` configurado neste checkout — sem organização/usuário de teste seedado, o fluxo crítico completo de `docs/QUALITY_AND_ACCEPTANCE.md` §4 (login → oportunidade → proposta → contrato → projeto → recebível → relatório) não pode ser escrito e executado de verdade nesta sessão. Escrever esses specs sem nunca rodá-los seria exatamente o tipo de "mock como resultado final" que o `CLAUDE.md` proíbe.
- Confirmado nesta sessão (via `npm run dev` local): o servidor sobe e responde mesmo sem `DATABASE_URL` real (a connection string cai num fallback `postgres://postgres:postgres@localhost:5432/pulso_crm_dev`, e a lib `postgres` só conecta de fato na primeira query) — páginas públicas (`/login`) renderizam, e uma tentativa de login real retorna `500` (confirmado via rede do navegador) tratado com uma mensagem de erro na tela, sem crash.

## Escopo

- Instalar `@playwright/test` (dev dependency) + navegador `chromium` (`npx playwright install chromium`).
- `playwright.config.ts`: `testDir: "./e2e"`, `webServer` inicia `npm run dev` automaticamente (ou reaproveita um já rodando), `baseURL` configurável por env.
- `package.json`: script `test:e2e` (igual ao especificado na doc). Não entra no `check` combinado (a doc também não inclui — E2E precisa de servidor/banco rodando, `check` precisa ser executável sem isso).
- `vitest.config.ts`: excluir `e2e/**` do Vitest (mesmo padrão de nome `*.spec.ts`, colidiria sem isso).
- `.gitignore`: artefatos do Playwright (`test-results/`, `playwright-report/`, `blob-report/`).
- `e2e/auth.spec.ts`: specs reais, executados nesta sessão contra o servidor local:
  - login renderiza os campos esperados;
  - login com credenciais inválidas mostra mensagem de erro, sem crashar a página;
  - rotas internas (`/crm/pipeline`, `/crm/tarefas`, `/crm/tarefas/calendario`, `/dashboard`) redirecionam para `/login` sem sessão.

## Fora de escopo (registrado como próximo passo, não esquecido)

- O fluxo crítico completo de `docs/QUALITY_AND_ACCEPTANCE.md` §4 e §5 (login autenticado de verdade → empresa → contato → oportunidade → tarefa → proposta → publicação → aceite → contrato → assinatura → recebível → projeto → arquivo → aprovação → relatório) — exige uma organização e usuário de teste reais (seed dedicado, idealmente banco de teste isolado do de produção) e não foi possível nesta sessão.
- Os "casos negativos obrigatórios" de §6 (token expirado/revogado, parcela já paga, conflito de edição etc.) — mesma dependência de dado real.
- Firefox/WebKit (só chromium instalado, suficiente para o primeiro lote).

## Critérios de aceite verificáveis

- `npx playwright test` roda e os 6 specs escritos passam de verdade (confirmado nesta sessão, não só "deveria passar").
- `npm run test:e2e` existe e produz o mesmo resultado.
- `vitest run` continua ignorando `e2e/**` (nenhuma colisão de arquivo `*.spec.ts`).
- Tipos e lint passam nos arquivos novos.

## Regras de autorização

Não aplicável — specs desta rodada não autenticam (cobrem o que é observável sem sessão).

## Alterações de banco

Nenhuma.

## Plano de testes

Os próprios specs de E2E são o teste. Executados 2x nesta sessão (após escrever e após o build final), 6/6 passando as duas vezes.

## Migração / Rollback / Feature flag

Não aplicável — só ferramenta de teste e configuração, nenhum código de produção alterado.

## Dependências

Nenhuma.

## Riscos

- O primeiro lote não cobre nenhum fluxo de negócio autenticado — é infraestrutura + smoke tests do "golden path de acesso" (login/guard). Isso é uma limitação real, não uma escolha de conveniência: sem organização/usuário de teste seedado, nenhum spec autenticado poderia ser executado (só escrito e nunca confirmado), o que seria pior que não ter o spec.

## Definition of Done

- Infraestrutura instalada e configurada.
- 6 specs reais escritos e executados com sucesso (não hipotéticos).
- `tsc`/`vitest`/`build` verdes.
- Sem segredo no diff.
- `IMPLEMENTATION_STATUS.md` atualizado com o que falta pro fluxo crítico completo.
- Rollback praticável (reverter commit; nenhuma mudança de banco).

## Dev Agent Record

### File List

- `package.json` — +`@playwright/test` (devDependency), +script `test:e2e`.
- `pnpm-lock.yaml` — atualizado (só a adição do Playwright e suas transitivas).
- `playwright.config.ts` — novo.
- `vitest.config.ts` — exclui `e2e/**`.
- `.gitignore` — +artefatos do Playwright.
- `e2e/auth.spec.ts` — novo, 6 specs.

### Completion Notes

- **Bloqueio real de ambiente encontrado e resolvido com autorização do responsável**: `pnpm add` falhou (`ERR_PNPM_UNEXPECTED_STORE`) porque o `node_modules` estava linkado a partir do store `.pnpm-store\v11`, mas o `pnpm` disponível neste ambiente é `10.34.5` (store `v10`); `corepack` (que buscaria a versão certa) falhou por erro de verificação de assinatura do registro. Perguntei ao responsável como proceder; ele autorizou `pnpm install` para reconciliar. Executado com `CI=true` (evita prompt interativo de confirmação de purge do `node_modules`, sem TTY neste ambiente) — resultado: todas as 219 dependências resolvidas exatamente nas mesmas versões já travadas no lockfile (nenhuma mudança de versão, só reconciliação do store).
- **Verificação real, não hipotética**: com o servidor local rodando (`npm run dev`, sem `DATABASE_URL` configurado), consegui pela primeira vez nesta sessão abrir o app de verdade no navegador — confirmei visualmente que `/login` renderiza, que `/crm/pipeline` e `/crm/tarefas/calendario` (novos desta sessão) redirecionam corretamente pra `/login` sem sessão, e que uma tentativa de login com credenciais inválidas retorna `500` do servidor (provavelmente por não haver um Postgres real respondendo em `localhost:5432`) mas a tela trata isso com uma mensagem de erro, sem crashar — todos os specs escritos refletem exatamente esse comportamento já confirmado manualmente, não uma suposição.
- `playwright.config.ts` usa `webServer` com `reuseExistingServer: true` fora de CI — reaproveitou o servidor que eu já tinha rodando manualmente durante a verificação.
- `tsc --noEmit`: limpo. `vitest run`: 86/86 (inalterado — confirma que `e2e/**` não colidiu). `next build`: verde, 32 rotas (sem rota nova). `biome lint` nos arquivos novos: 0 erros. `npx playwright test`: **6/6 passando**, executado de fato (não assumido).
- Débito explícito: o fluxo crítico completo de `docs/QUALITY_AND_ACCEPTANCE.md` §4/§5 continua sem cobertura E2E — precisa de organização/usuário de teste seedado (idealmente banco isolado). Registrado como próximo passo natural quando houver acesso a banco de teste, não escondido.
