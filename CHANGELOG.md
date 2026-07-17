# CHANGELOG — PULSO CRM

Todas as mudanças relevantes devem ser registradas aqui.

## [Não lançado]

### Adicionado

- Pacote de documentação para execução estruturada pelo Claude.
- Decisão formal de CRM interno e exclusivo da PULSO.
- Protocolo de implementação, qualidade e segurança.

### Alterado

- Removida da direção do produto qualquer intenção de SaaS, white label, billing ou comercialização do CRM.

### Segurança

- Registrada necessidade de remover credencial administrativa do seed e rotacionar a senha.

---

## [2026-07-17] — Fase 0: auditoria, seed seguro e ponte de design tokens

### Corrigido

- `src/server/db/seed.ts`: removida a senha administrativa hardcoded (`pulso_admin_secure`) e o `console.log` que a expunha. Seed agora exige `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` via ambiente e falha com erro claro se ausentes. Seed passou a ser idempotente (organização, papel e usuário são reaproveitados se já existirem).
- `src/app/globals.css`: adicionado bloco `@theme` ligando os tokens Pulso já existentes (`--paper`, `--carbon`, `--signal`...) às classes Tailwind que `components/ui/*` já esperava (`bg-pulso-signal`, `rounded-card`, `duration-base`, etc.), que antes não existiam e não renderizavam nada.

### Adicionado

- `.env.example`: documentadas as variáveis `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
- Pacote `CLAUDE.md` / `IMPLEMENTATION_STATUS.md` / `docs/*` copiado para a raiz do repositório, substituindo a orientação anterior de possível SaaS/white label.

### Segurança

- Senha administrativa ainda ativa em produção com o hash antigo; rotação pendente de autorização explícita (não executada nesta fase, que é somente-leitura em produção).
- `BETTER_AUTH_SECRET` confirmado como não persistido na configuração salva do Dokploy — regride a cada redeploy iniciado por push/UI.

### Testes

- `biome check .`: 43 erros (nenhum bloqueante), detalhados em `IMPLEMENTATION_STATUS.md`.
- `tsc --noEmit`: limpo.
- `vitest run`: 2/2 passando.
- `next build`: verde, 30 rotas.

### Migrações

- `0002_safe_exiles.sql` (adiciona `projects.contract_id`) confirmada aplicada em produção; 0 referências órfãs.

---

## [2026-07-17] — Fase 1: workspace, papéis e autorização real

### Adicionado

- `src/server/auth/permission-keys.ts`: catálogo tipado de permissões e mapeamento papel→permissão para os 6 papéis (`owner`, `admin`, `commercial`, `projects`, `finance`, `viewer`).
- `src/server/auth/require-permission.ts`: helper central `requirePermission(key)` — resolve sessão, membership ativo e papel no servidor, confere permissão via banco, nunca confia em `organizationId` do cliente.
- `src/server/db/seed-permissions.ts`: seed idempotente de permissões/papéis, migra o antigo papel `super_admin` para `owner` em vez de duplicar. Executado contra produção: 69 permissões e 6 papéis criados, admin existente migrado com sucesso.
- `updateProduct` em `src/server/actions/products.ts` (faltava; a página de edição fazia `db.update` direto, sem filtro de organização).

### Corrigido

- Toda server action interna (`pipeline`, `companies`, `contacts`, `products`, `quotes`, `briefing-templates`, `briefing-submissions`, `contracts`, `projects`) agora exige sessão e permissão via `requirePermission()` e usa o `organizationId`/`userId` resolvido no servidor — nenhuma mais confia em valor recebido como parâmetro. As públicas por token (`getPublicContract`, `signContractPublic`) continuam sem sessão, como deveria ser.
- `toggleChecklistItem` (projetos) não verificava organização nenhuma antes de atualizar um item por ID; agora confirma que o projeto pertence ao workspace do usuário.

### Testes

- `tsc --noEmit`, `vitest run` (2/2), `next build` (30 rotas): verdes.
- Validação manual de ponta a ponta com `next dev` apontado para o banco de produção via túnel SSH: login, `/crm/pipeline` (leitura + criação de oportunidade), `/crm/contatos`, `/crm/empresas`, `/crm/quotes`, `/crm/contratos`, `/crm/projetos`.

---

Formato recomendado por alteração:

```text
## [AAAA-MM-DD] — título

### Adicionado
### Alterado
### Corrigido
### Removido
### Segurança
### Migrações
### Testes
```
