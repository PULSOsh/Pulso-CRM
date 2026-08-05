# CRM-F5-02 — Base de conhecimento

Status: Done (implementado 2026-08-05)

## Objetivo

Manter artigos de apoio (rascunho/publicado) reaproveitáveis tanto internamente quanto na central de ajuda pública (F5-03).

## Escopo

- `knowledge_articles` (novo): título, slug único por organização, corpo, categoria livre, status.
- `slugify` (`services/slug.ts`, pure function, testada com acentuação/pontuação pt-BR) + `uniqueSlug` (sufixo incremental em caso de colisão).
- `createKnowledgeArticle`/`updateKnowledgeArticle`/`publishKnowledgeArticle`/`unpublishKnowledgeArticle`/`getKnowledgeArticles` (internas).
- `getPublishedKnowledgeArticles`/`getPublishedKnowledgeArticleBySlug` (públicas, sem token nem sessão - central de ajuda é conteúdo institucional, não dado de cliente).

## Fora de escopo

- Versionamento de artigo (edição sobrescreve direto - diferente do versionamento imutável de proposta/contrato, aqui é conteúdo de apoio, não evento de negócio).
- Editor rich-text (corpo é texto simples com quebras de linha preservadas na renderização).

## Critérios de aceite verificáveis

- Dois artigos com o mesmo título geram slugs diferentes (`titulo`, `titulo-2`).
- Um artigo em rascunho nunca aparece em `getPublishedKnowledgeArticles`.
- Tipos, testes e build passam.

## Regras de autorização

`knowledge.read`/`knowledge.manage` (novas). Funções públicas não usam `requirePermission`.

## Alterações de banco

Tabela `knowledge_articles` (nova) + enum `knowledge_article_status`, parte de `0013_fase5_atendimento_automacao_base.sql`.

## Dev Agent Record

### File List

- `src/server/db/schema/support.ts`.
- `src/server/services/slug.ts` + `.test.ts` — novos.
- `src/server/actions/knowledge.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/components/crm/knowledge/knowledge-client.tsx`, `src/app/crm/base-de-conhecimento/page.tsx` — novos.

### Completion Notes

`tsc --noEmit`, `vitest run` (205/205), `biome check`, `next build` — todos verdes.
