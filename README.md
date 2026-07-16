# PULSO CRM Starter V2

Fundação visual em Next.js para o PULSO CRM, atualizada com a jornada completa de **briefing público e orçamento em site**.

## Incluído

- tela de login visual;
- layout interno com menu lateral;
- dashboard inicial;
- Kanban demonstrativo;
- caixa de entrada de briefings;
- formulário público de briefing;
- gerador interno de orçamento com preview lateral;
- página pública de proposta;
- dados fictícios tipados;
- identidade visual oficial da PULSO;
- Dockerfile, health check, Biome, Vitest e configuração de build;
- plano mestre e documentos técnicos na própria raiz do starter.

## Rotas visuais

- `/login`
- `/dashboard`
- `/crm`
- `/briefings`
- `/solicitar/site-essencial`
- `/orcamentos/novo`
- `/proposta/exemplo`
- `/api/health`

Os slugs e tokens das duas rotas públicas são demonstrativos nesta fundação.

## Ainda não conectado

- autenticação real e recuperação de senha;
- PostgreSQL e ORM;
- organizações, usuários e permissões;
- persistência do Kanban e dos briefings;
- upload de arquivos;
- cálculo e versionamento persistente de propostas;
- e-mail, PDF, aceite e auditoria transacional;
- contratos, projetos, financeiro e notificações reais.

A implementação está dividida fase a fase em `PLANO_MESTRE_CODEX.md`.

## Rodar localmente

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000/login`.

## Validar

```bash
npm run check
```

O comando executa lint, TypeScript, testes e build de produção.

## Ordem de leitura para o Codex

1. `AGENTS.md`
2. `README.md`
3. `PLANO_MESTRE_CODEX.md`
4. `docs/PRODUCT_REQUIREMENTS.md`
5. `design-system/DESIGN_SYSTEM.md`
6. `docs/BRIEFINGS_PUBLICOS.md`
7. `docs/ORCAMENTOS_EM_SITE.md`
8. `docs/API_EVENTOS.md`
9. `docs/SECURITY_PRIVACY.md`
10. `database/reference/`
