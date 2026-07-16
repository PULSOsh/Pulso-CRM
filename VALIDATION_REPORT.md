# PULSO CRM Starter V2 — Validation Report

Validado em 16 de julho de 2026.

## Verificações concluídas

- `npm run lint` — aprovado em 42 arquivos;
- `npm run typecheck` — aprovado;
- `npm run test` — 2 arquivos e 2 testes aprovados;
- `npm run build` — aprovado com Next.js 16.2.10.

## Rotas geradas

- `/`
- `/_not-found`
- `/api/health`
- `/login`
- `/dashboard`
- `/crm`
- `/briefings`
- `/orcamentos/novo`
- `/proposta/[token]`
- `/solicitar/[slug]`

## Observações de implantação

- saída standalone do Next.js habilitada;
- Docker configurado para usuário não-root;
- aplicação expõe internamente a porta 3000;
- Dokploy/Traefik deve assumir domínio, roteamento e HTTPS;
- health check aponta para `/api/health`;
- o build da aplicação foi validado;
- a execução da imagem Docker não foi testada porque o ambiente de geração não disponibiliza um daemon Docker.

## Natureza do starter

As telas usam dados demonstrativos. O backend, banco, autenticação, upload, envio, versionamento e respostas públicas devem ser implementados conforme `PLANO_MESTRE_CODEX.md`.
