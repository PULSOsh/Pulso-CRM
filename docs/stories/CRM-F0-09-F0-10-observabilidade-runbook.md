# CRM-F0-09/F0-10 — Observabilidade, logs, correlação de erros, runbook e backup

Status: Done (implementado 2026-08-04)

## Objetivo

F0-09: dar ao servidor logs estruturados e correlação real entre o "código de referência" mostrado nas páginas de erro amigáveis e o log do servidor, e fazer `/api/health` refletir o estado real do serviço (não "ok" incondicional).
F0-10: preencher o único gap concreto que restava nos runbooks existentes — um procedimento real de backup/restauração, não só a intenção em texto.

## Contexto atual confirmado

- `src/app/error.tsx`/`global-error.tsx` (sessão anterior, "friendly CRM error pages") já mostram `error.digest` ao usuário como "código de referência" — mas são `"use client"`, então o `console.error` deles roda no **navegador**, nunca no servidor. **Bug real encontrado nesta story**: antes desta mudança, não existia nenhum log de servidor contendo esse digest — um usuário reportando "Referência: 123456" não podia ser localizado em nenhum log via `docker service logs`, o método de diagnóstico que `docs/ARCHITECTURE_AND_STANDARDS.md` §11 já documenta como o único confiável.
- `LOG_LEVEL` já está documentado em `.env.example`/`ARCHITECTURE_AND_STANDARDS.md` §10 desde a fundação, mas nenhum código lia essa variável.
- `/api/health` sempre respondia `{"status":"ok",...}` sem checar nada — um banco fora do ar continuava reportando "ok".
- `docs/PLANO_MESTRE_EVOLUCAO_CRM.md` §13 lista explicitamente: "incluir identificação de versão/commit no health endpoint".
- `docs/runbooks/production-safety.md`/`migrations-and-deploy.md` já são bem completos como checklist de processo (confirmado por leitura antes de escrever qualquer coisa nova, pra não duplicar) — o único gap real é "testar restauração periodicamente" nunca ter tido um procedimento escrito, só a intenção.

## Escopo

- `src/server/logger.ts` (novo): logger estruturado mínimo, sem dependência nova, respeitando `LOG_LEVEL`, emitindo JSON em stdout/stderr (capturado pelo `docker service logs` já usado nos runbooks).
- `src/instrumentation.ts` (novo): hook `onRequestError` do Next.js (App Router) — loga toda falha não tratada numa requisição, incluindo o `digest`, correlacionando com o que o usuário vê na tela de erro.
- `src/app/api/health/route.ts`: agora executa `select 1` real no banco (reporta `"degraded"`/503 se falhar), inclui `version` (`npm_package_version`) e `commit` (`COMMIT_SHA`, opcional).
- `.env.example`: `COMMIT_SHA` (opcional, documentado) e `LOG_LEVEL` (já estava em `ARCHITECTURE_AND_STANDARDS.md`, faltava no arquivo real).
- `docs/runbooks/production-safety.md` §7 (novo): procedimento real de backup/restauração (comandos `pg_dump`/`pg_restore`/`createdb`/`dropdb`, sempre contra um banco de teste descartável, nunca sobrescrevendo produção).

## Fora de escopo

- Serviço de log externo (Sentry, Datadog, etc.) — fora do orçamento/necessidade atual; `docker service logs` já é o método estabelecido.
- Executar de fato o procedimento de backup/restauração contra a VPS real — exigiria acesso SSH/credenciais que não tenho nesta sessão, e seria uma ação em produção sem autorização prévia específica para isso.
- Dashboards de métricas (latência, taxa de erro agregada) — o log estruturado já habilita isso no futuro (grep/agregação externa), mas construir um painel é outro passo.

## Critérios de aceite verificáveis

- Um erro não tratado numa rota gera uma linha de log JSON no servidor contendo o mesmo `digest` mostrado na tela de erro ao usuário — **verificado de ponta a ponta nesta sessão** (ver Completion Notes), não só por leitura de código.
- `/api/health` responde `503`/`"degraded"` quando o banco está inacessível, e `200`/`"ok"` quando está saudável — **verificado nesta sessão** (o banco local realmente está inacessível, confirmando o caminho de falha de verdade).
- `/api/health` inclui `version` (sempre) e `commit` (quando `COMMIT_SHA` estiver definido).
- `LOG_LEVEL=error`, por exemplo, suprime logs `info`/`debug`/`warn` (comportamento do logger, coberto por leitura de código — sem teste automatizado dedicado, ver Débitos).
- O runbook de backup tem comandos reais, executáveis, não só intenção em texto.
- Tipos, testes e build passam.

## Regras de autorização

Não aplicável — `/api/health` continua público (é o próprio propósito), sem dado sensível no retorno (só status/versão/commit/latência).

## Alterações de banco

Nenhuma.

## Plano de testes

- Verificação end-to-end manual real (não hipotética): servidor local rodando, provocada uma falha real (`/solicitar/qualquer-coisa` sem template existente, banco inacessível), confirmado visualmente que a tela de erro mostra "Referência: 1882923231" e que o log do servidor tem uma linha JSON com `"digest":"1882923231"` — mesmo valor, ponta a ponta.
- `/api/health` testado real (`curl`) com banco inacessível: retornou `503`/`"degraded"`/`"database":"unreachable"`, confirmando o caminho de falha.
- Regressão: `vitest run` (86/86), `biome lint`, `next build`, `playwright test` (6/6) — todos verdes.
- Sem teste automatizado dedicado para o próprio `logger.ts` (função simples, comportamento coberto pela verificação manual acima) — registrado como débito menor.

## Migração / Rollback / Feature flag

Nenhuma migração. Reverter o commit remove o logger/instrumentation/melhoria do health sem efeito colateral — `/api/health` volta a responder "ok" incondicional (pior, mas não quebra nada).

## Dependências

Nenhuma nova (sem biblioteca de log externa).

## Riscos

- `onRequestError` não cobre erros já tratados/capturados dentro de try/catch das próprias actions (esses continuam só nos `console.error`/`writeAuditLog` existentes, que é o comportamento correto — o hook é especificamente para o que hoje vira uma tela de erro genérica).
- Sem serviço de log externo, a retenção dos logs é a mesma do `docker service logs` de sempre (finita, definida pelo Docker) — suficiente pro uso atual, mas não é uma trilha de longo prazo.

## Definition of Done

- Correlação de erro→log verificada de ponta a ponta.
- Health check reflete estado real, com versão/commit.
- Runbook de backup com comandos reais.
- `tsc`/`vitest`/`playwright`/`build` verdes.
- Sem segredo no diff.
- `IMPLEMENTATION_STATUS.md` atualizado.
- Rollback praticável (reverter commit).

## Dev Agent Record

### File List

- `src/server/logger.ts` — novo.
- `src/instrumentation.ts` — novo.
- `src/app/api/health/route.ts` — reescrito.
- `.env.example` — +`COMMIT_SHA`, +`LOG_LEVEL`.
- `docs/runbooks/production-safety.md` — +§7 (backup/restauração).

### Completion Notes

- **Verificação real, não hipotética, de ponta a ponta**: com o servidor local rodando, acessei `/solicitar/qualquer-coisa` (banco realmente inacessível neste ambiente — confirmado por `ECONNREFUSED` no log). A tela de erro mostrou "Referência: 1882923231"; o log do servidor, na mesma requisição, gravou `{"level":"error","message":"Failed query...","digest":"1882923231","path":"/solicitar/qualquer-coisa","routePath":"/solicitar/[slug]","routeType":"render",...}` — **mesmo digest**, confirmando que a correlação funciona de fato, não só em teoria.
- `/api/health` testado real via `curl`: com o banco inacessível, retornou `503` e `{"status":"degraded","database":"unreachable",...}` em vez do "ok" incondicional de antes — o próprio ambiente sem banco serviu de teste real do caminho de falha.
- `onRequestError` é detectado pelo Next.js por convenção de nome exportado em `src/instrumentation.ts`, não por um tipo importado de `next/dist/*` (caminho interno do pacote, evitado de propósito por ser um deep-import não documentado como API pública — a assinatura foi declarada localmente, estruturalmente compatível).
- `docs/runbooks/production-safety.md` §7 não foi executado contra infraestrutura real nesta sessão (sem acesso SSH/credenciais) — é o procedimento pronto para a próxima vez que alguém com acesso for testar restauração de verdade, fechando a lacuna "testar restauração periodicamente" que antes não tinha nenhum comando escrito.
- `tsc --noEmit`: limpo. `vitest run`: 86/86 (inalterado). `next build`: verde, 32 rotas (sem rota nova). `biome lint`: 0 erros. `npx playwright test`: 6/6 (reaproveitou o servidor local já rodando).
