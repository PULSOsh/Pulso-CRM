# Runbook — Segurança de produção

## 1. Princípio

Produção contém a fonte real de dados. Mesmo quando o banco está quase vazio, não utilizar produção como ambiente descartável.

## 2. Ações somente leitura permitidas na auditoria

- health check;
- contagens;
- leitura de schemas;
- leitura da tabela de migrations;
- verificação de vínculos;
- consulta de configuração não secreta;
- validação de páginas sem mutação.

## 3. Ações que exigem autorização

- deploy;
- migration;
- seed;
- alteração de variável;
- rotação de secret;
- alteração de usuário;
- exclusão;
- backfill;
- importação;
- correção manual de dados.

## 4. Credenciais

- nunca escrever senha neste repositório;
- nunca incluir secret em relatório;
- usar nomes das variáveis, não valores;
- evitar logs de sessão;
- rotacionar senha exposta;
- persistir `BETTER_AUTH_SECRET` corretamente no Dokploy;
- revisar se a troca invalida sessões e planejar o efeito.

## 5. Seeds

- idempotentes;
- não destrutivos;
- credenciais via ambiente;
- não executados automaticamente em todo deploy;
- catálogo não deve ser duplicado;
- bootstrap de admin deve detectar existência.

## 6. Backups

Antes de mudança de banco:

- criar backup externo;
- registrar data;
- registrar banco e ambiente;
- verificar tamanho;
- preservar retenção;
- testar restauração periodicamente.

Backup não testado não é estratégia de recuperação.
