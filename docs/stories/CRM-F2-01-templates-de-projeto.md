# CRM-F2-01 — Templates de projeto

Status: Done (implementado 2026-08-04)

## Objetivo

Permitir criar templates reutilizáveis de checklist, evitando recriar a mesma lista de tarefas a cada novo projeto gerado.

## Escopo

- `project_templates` (nome único por org) + `project_template_checklist_items` (novo).
- `getProjectTemplates`/`createProjectTemplate`/`deleteProjectTemplate` (soft, `isActive`).
- `createProjectFromContract(contractId, templateId?)`: quando informado, valida posse e usa os itens do template em vez do `DEFAULT_CHECKLIST` fixo.
- UI: seletor de template + criação inline no modal "Gerar Projeto" (`/crm/projetos`).

## Fora de escopo

- Tela dedicada de gestão de templates (criação só inline, no fluxo de geração).
- Templates de marcos (só checklist nesta story).

## Critérios de aceite verificáveis

- Criar um template com itens de checklist e gerar um projeto com ele usa exatamente esses itens.
- Gerar um projeto sem selecionar template continua usando o checklist padrão de sempre (comportamento inalterado).
- `templateId` de outra organização é rejeitado.
- Tipos, testes e build passam.

## Regras de autorização

`projects.create` (mesma chave já usada para gerar projeto e criar template).

## Alterações de banco

2 tabelas novas. Migration aditiva (`0010_lonely_cardiac.sql`, compartilhada com as demais stories F2-02 a F2-06), **não aplicada**.

## Dev Agent Record

### File List

- `src/server/db/schema/projects.ts` — `projectTemplates`/`projectTemplateChecklistItems`.
- `src/server/actions/project-templates.ts` + `.schemas.ts` + `.schemas.test.ts` — novos.
- `src/server/actions/projects.ts` — `createProjectForSignedContract`/`createProjectFromContract` aceitam `templateId`.
- `src/components/crm/projects-client.tsx` — seletor + criação inline de template.

### Completion Notes

`tsc --noEmit`, `vitest run` (127/127 no lote completo da Fase 2), `biome lint`, `next build` (33 rotas) — todos verdes. Verificação com dado real não foi possível (mesma limitação de toda a sessão).