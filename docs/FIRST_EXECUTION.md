# Primeira execução obrigatória do Claude

## Objetivo

Não desenvolver módulos novos. Produzir um diagnóstico verificável e estabilizar o ponto de partida.

## 1. Ler antes de agir

Ler integralmente:

- `CLAUDE.md`;
- `IMPLEMENTATION_STATUS.md`;
- documentos em `docs/`;
- `AGENTS.md` existente;
- documentação de componentes existente;
- schemas e migrations;
- configuração de deploy;
- package scripts.

## 2. Auditar Git

Executar:

```bash
git status
git diff
git diff --staged
git log --oneline --decorate -20
```

Registrar:

- branch;
- commit atual;
- arquivos modificados;
- arquivos não rastreados;
- conflitos;
- mudanças WIP;
- relação entre migration `0002` e schema atual.

Não limpar o working tree.

## 3. Executar checks reais

Executar o package manager correto e os scripts disponíveis:

- instalação;
- lint;
- typecheck;
- testes;
- build.

Se um script não existir, registrar e propor o equivalente.

Não corrigir tudo silenciosamente antes de registrar o baseline.

## 4. Auditar produção e banco sem alterar dados

Verificar de forma somente leitura:

- health;
- login;
- tabela de migrations;
- contagens principais;
- estrutura de organização/workspace;
- usuário administrador;
- produtos;
- referências órfãs;
- diferenças entre schema e banco.

Não registrar senhas nem tokens.

## 5. Segurança

Buscar:

- senha hardcoded;
- token hardcoded;
- secret em seed;
- `.env` commitado;
- credencial em documentação;
- log de dados sensíveis;
- endpoint público sem rate limit;
- action sem autorização;
- upload sem validação.

Corrigir primeiro o seed inseguro em mudança pequena e testável.

## 6. Mapa técnico

Produzir inventário de:

- rotas;
- páginas;
- layouts;
- route handlers;
- server actions;
- schemas;
- tabelas;
- migrations;
- módulos;
- mocks;
- feature flags;
- jobs;
- providers;
- componentes UI;
- links mortos;
- rotas duplicadas.

## 7. Auditoria de autorização

Listar:

- actions que não validam sessão;
- actions que não validam papel;
- consultas sem filtro do workspace;
- uso de `organization_id` vindo do cliente;
- páginas que apenas escondem botão;
- endpoints públicos sem validação adequada.

## 8. Design system

Verificar:

- versão do Tailwind;
- uso de `@theme`;
- tokens registrados;
- classes inexistentes;
- componentes em `components/ui/`;
- quantidade de imports reais;
- estilos arbitrários;
- fontes;
- SVGs oficiais;
- acessibilidade do shell.

Não iniciar redesign total.

## 9. Rotas e mocks

Identificar especialmente:

- `/crm` antigo;
- `/briefings` antigo;
- páginas com dados mockados;
- navegação para Tarefas;
- link público de proposta em rascunho;
- contratos em Tailwind cru;
- projetos WIP.

## 10. Atualizar documentação

Atualizar `IMPLEMENTATION_STATUS.md` com:

- data e hora;
- branch e commit;
- working tree;
- resultados dos checks;
- migrations;
- módulos reais;
- riscos;
- bloqueios;
- próxima ação exata.

Adicionar entrada ao `CHANGELOG.md` apenas para mudanças realmente realizadas.

## 11. Plano de commits

Propor commits pequenos, por exemplo:

1. `docs: establish implementation baseline`
2. `security: remove hardcoded bootstrap credentials`
3. `fix: reconcile tailwind design tokens`
4. `refactor: centralize internal permission context`
5. `chore: isolate legacy mock routes`

Não criar todos antes de validar dependências.

## 12. Relatório obrigatório da primeira execução

```text
ESTADO DO GIT:
WORKING TREE:
CHECKS:
MIGRATIONS:
PRODUÇÃO:
SEGREDOS ENCONTRADOS:
ROTAS MOCKADAS OU DUPLICADAS:
ACTIONS SEM AUTORIZAÇÃO:
CONSULTAS SEM FILTRO:
DESIGN SYSTEM:
RISCOS DE DADOS:
CORREÇÕES REALIZADAS:
ARQUIVOS ALTERADOS:
TESTES EXECUTADOS:
IMPLEMENTATION_STATUS ATUALIZADO:
PLANO DE COMMITS:
PRÓXIMA AÇÃO EXATA:
```

## 13. Limites desta execução

Não:

- fazer deploy;
- iniciar financeiro;
- refazer contratos;
- concluir projetos;
- criar novas telas;
- alterar dados reais;
- executar migration nova;
- remover `organization_id`;
- criar recursos SaaS.
