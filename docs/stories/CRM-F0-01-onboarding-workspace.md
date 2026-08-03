# CRM-F0-01 — Onboarding idempotente do workspace

Status: Ready for Review

## Objetivo

Garantir que o seed inicial crie ou repare organização, papéis, permissões, credencial e vínculo administrativo, inclusive quando o usuário já tiver sido criado pelo Better Auth.

## Critérios de aceite

- Usuário inexistente é criado com credencial e vínculo owner ativo.
- Usuário existente é reutilizado sem ter a senha sobrescrita.
- Usuário existente sem vínculo recebe vínculo owner ativo.
- Vínculo existente é reparado para owner ativo.
- Organização usa o domínio `pulsosh.cloud`.
- Execuções repetidas não duplicam registros.
- Tipos, testes e build passam.

## Tarefas

- [x] Remover a saída antecipada para usuário existente.
- [x] Tornar credencial e vínculo idempotentes.
- [x] Atualizar metadados da organização.
- [x] Executar validações.

## Dev Agent Record

### File List

- `src/server/db/seed.ts`

### Completion Notes

- Usuários existentes são reutilizados e suas senhas são preservadas.
- Credencial ausente é criada com o hash nativo do Better Auth.
- Membership ausente é criada; membership existente é reparada para owner ativo.
- Organização nova usa o e-mail administrativo e `https://pulsosh.cloud`.
- Validações concluídas: typecheck, 59 testes e build de produção com 22 páginas.
