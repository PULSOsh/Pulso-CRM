# CRM-F4-11 — Testes negativos de privacidade

Status: Done (implementado 2026-08-05)

## Objetivo

Fechar o gate da Fase 4 - "usuários sem acesso não conseguem consultar nem inferir dados pessoais por UI, action, API, exportação, relatório ou log" - com evidência automatizada, não só inspeção manual.

## Achado

Antes desta story, **nenhum teste** verificava isolamento de dados pessoais - só existiam testes das fórmulas matemáticas puras de lucratividade (`services/profitability.test.ts`). Sem banco disponível neste ambiente, testes de integração reais (criar usuário sem permissão, tentar ler dado pessoal, esperar rejeição) não são possíveis - a cobertura possível e real é: (1) verificação estática do mapeamento papel→permissão, e (2) teste unitário puro da trava de `ownerUserId`.

## Escopo

- `src/server/auth/permission-keys.test.ts` (novo): confirma que `owner` é o único papel com `profitability.read_personal`/`manage_personal`/`view_founder_summary`, que nenhum outro papel (incluindo `admin`) tem qualquer uma das três, e que a exclusão do `admin` é específica do pessoal (ele continua tendo `profitability.read_business`).
- `src/server/services/personal-workspace.test.ts` (novo): `isAuthorizedPersonalOwner` (pure function extraída de `requirePersonalAccess`) rejeita um usuário que não é o `ownerUserId` fixado mesmo com o objeto workspace presente, e rejeita quando o workspace ainda não existe.

## Fora de escopo

- Teste E2E de dois usuários reais tentando acessar dados um do outro - exigiria banco e múltiplos usuários seedados, fora do alcance deste ambiente.

## Critérios de aceite verificáveis

- `permission-keys.test.ts` falha se qualquer papel além de `owner` ganhar uma chave `*_personal` no futuro (proteção contra regressão ao editar `ROLE_PERMISSIONS`).
- `personal-workspace.test.ts` falha se `isAuthorizedPersonalOwner` for alterada para aceitar qualquer usuário com o papel certo, sem checar o `ownerUserId`.

## Regras de autorização

N/A - são os próprios testes da regra de autorização.

## Alterações de banco

Nenhuma.

## Dev Agent Record

### File List

- `src/server/auth/permission-keys.test.ts` — novo.
- `src/server/services/personal-workspace.ts` — `isAuthorizedPersonalOwner` extraída como função pura testável.
- `src/server/services/personal-workspace.test.ts` — novo.

### Completion Notes

`vitest run`: 180/180 (incluindo os 2 arquivos novos desta story). Documentado explicitamente como cobertura estática/unitária, não teste de integração com banco real - é o máximo de evidência automatizada possível neste ambiente sem `DATABASE_URL`.
