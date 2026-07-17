# Runbook — Migrations e deploy

## 1. Antes de migration

- revisar `git status`;
- confirmar branch e commit;
- executar checks;
- comparar schema e migrations;
- consultar tabela de migrations em produção;
- gerar backup;
- confirmar restauração ou plano de rollback;
- avaliar locks e duração;
- registrar impacto.

## 2. Migration já aplicada

Nunca:

- editar silenciosamente migration aplicada;
- recriar com outro conteúdo;
- apagar arquivo local;
- assumir estado apenas pelo nome.

Comparar checksum, conteúdo, schema e tabela de migrations.

A migration `0002` precisa ser reconciliada antes de qualquer nova migration.

## 3. Aplicação

- aplicar primeiro em ambiente seguro quando disponível;
- executar em janela controlada;
- acompanhar logs;
- validar health e readiness;
- executar smoke tests;
- confirmar integridade dos dados;
- registrar resultado.

## 4. Deploy

Não fazer deploy sem autorização explícita.

Checklist:

- commit identificado;
- working tree limpo ou justificadamente controlado;
- lint verde;
- typecheck verde;
- testes verdes;
- build verde;
- variáveis persistidas no Dokploy;
- backup confirmado;
- migration revisada;
- rollback definido;
- health check;
- smoke test de login;
- smoke test do fluxo alterado.

## 5. Pós-deploy

- validar `/api/health`;
- validar login;
- verificar logs;
- verificar migration;
- verificar rota alterada;
- verificar erros do cliente;
- atualizar `IMPLEMENTATION_STATUS.md`;
- atualizar `CHANGELOG.md`.
