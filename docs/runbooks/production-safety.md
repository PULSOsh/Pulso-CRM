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

## 7. Procedimento de backup e restauração (CRM-F0-10)

Passo a passo real, não só a intenção. Nenhum comando desta seção deve ser
executado contra o banco de produção sem autorização explícita e sem seguir
antes o §3 deste runbook.

### 7.1 Criar backup

Via SSH no host da VPS (mesmo padrão já usado em sessões anteriores,
`docs/ARCHITECTURE_AND_STANDARDS.md` §11):

```bash
# Dentro do container do Postgres, formato "custom" (compacto, permite
# restauração seletiva por tabela se precisar)
docker exec <container-postgres> pg_dump -F c -U <usuario> <banco> \
  > /home/pulso/backups/pulsodb_$(date +%Y%m%d_%H%M).dump

# Confirmar tamanho (arquivo vazio/pequeno demais é sinal de falha silenciosa)
ls -lh /home/pulso/backups/pulsodb_*.dump | tail -1
```

Copiar o arquivo pra fora da VPS antes de confiar nele como backup real
(`scp`/download local) — um backup que só existe no mesmo host que ele
protege não é uma estratégia de recuperação contra falha de disco/VPS.

### 7.2 Testar restauração (nunca contra o banco de produção)

Restaurar sempre em um banco **novo e descartável**, nunca sobrescrevendo o
banco real, para confirmar que o arquivo de backup é válido e restaurável:

```bash
# Cria um banco temporário só pra teste de restauração
docker exec <container-postgres> createdb -U <usuario> pulsodb_restore_test

# Restaura o dump nesse banco temporário (não no "pulsodb" real)
docker exec -i <container-postgres> pg_restore -U <usuario> \
  -d pulsodb_restore_test /caminho/pulsodb_YYYYMMDD_HHMM.dump

# Verificação mínima de integridade: contagem de linhas nas tabelas
# principais deve bater com o que se espera (não zero, não muito diferente
# da última verificação)
docker exec <container-postgres> psql -U <usuario> -d pulsodb_restore_test \
  -c "select count(*) from organizations union all select count(*) from opportunities;"

# Descartar o banco de teste depois de confirmar
docker exec <container-postgres> dropdb -U <usuario> pulsodb_restore_test
```

Se a restauração falhar ou os números não fizerem sentido, o backup **não é
confiável** — investigar antes de depender dele, e não assumir que "o comando
rodou sem erro" é suficiente (comparar com contagens conhecidas de produção).

### 7.3 Registrar o resultado

Cada execução (criação ou teste de restauração) deve ser registrada em
`IMPLEMENTATION_STATUS.md`: data, quem executou, tamanho do arquivo, resultado
da verificação de integridade. Um backup nunca testado continua sendo "não
confirmado", mesmo que exista — ver débito já registrado na seção 23 desse
arquivo ("Backup feito por `pg_dump` manual pontual, não por rotina
automatizada").
