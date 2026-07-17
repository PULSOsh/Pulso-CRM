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
