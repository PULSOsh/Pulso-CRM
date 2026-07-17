# Arquitetura e padrões técnicos

## 1. Stack preservada

- Next.js com App Router;
- React;
- TypeScript estrito;
- Tailwind CSS;
- PostgreSQL;
- Drizzle ORM e Drizzle Kit;
- Better Auth;
- Zod;
- React Hook Form;
- dnd-kit;
- TanStack Table;
- TanStack Query somente quando necessário;
- date-fns;
- storage S3 compatível;
- provider SMTP;
- PDF gerado no servidor;
- Vitest;
- Testing Library;
- Playwright;
- Docker;
- Dokploy;
- Cloudflare;
- GitHub Actions.

Não trocar stack sem ADR e justificativa material.

## 2. Organização sugerida

```text
src/
  app/
    (auth)/
    (app)/
    (public)/
    api/
  components/
    ui/
    layout/
    shared/
  modules/
    auth/
    workspace/
    members/
    permissions/
    companies/
    contacts/
    pipelines/
    opportunities/
    activities/
    tasks/
    briefings/
    products/
    pricing/
    proposals/
    contracts/
    projects/
    approvals/
    files/
    finance/
    profitability/
    notifications/
    reports/
    audit/
    settings/
    integrations/
    ai/
  server/
  db/
    schema/
    migrations/
    seeds/
    client.ts
  lib/
  jobs/
  emails/
  tests/
```

Estrutura interna por módulo:

```text
modules/opportunities/
  components/
  server/
    repository.ts
    service.ts
    actions.ts
    queries.ts
  schemas.ts
  types.ts
  permissions.ts
  constants.ts
  tests/
```

## 3. Responsabilidade das camadas

### Componentes

Interface, interação, acessibilidade e feedback visual.

### Schemas

Validação, transformação, coerção e normalização.

### Actions e handlers

Sessão, workspace, permissão, validação de entrada e adaptação HTTP.

### Services

Regras de negócio, máquinas de estado, cálculos, idempotência e transações.

### Repositories

Acesso ao banco, filtros pelo workspace, paginação e consultas.

### Providers

E-mail, storage, PDF e serviços externos.

### Auditoria

Registro de ações críticas.

SQL não pode ser executado em componente ou página.

## 4. Single-workspace

O sistema possui somente o workspace PULSO.

Como `organization_id` já existe:

- manter nas entidades atuais;
- resolver internamente no servidor;
- não expor escolha ao usuário;
- não aceitar valor livre do cliente;
- não criar recursos multiempresa;
- não remover de forma destrutiva sem necessidade comprovada.

Esse campo funciona como fronteira interna de dados e compatibilidade com a base existente, não como estratégia SaaS.

## 5. Autorização

Criar helper central equivalente a:

```ts
const context = await requirePermission('opportunities.update')
```

O helper deve:

1. validar sessão;
2. resolver usuário;
3. resolver vínculo interno ativo;
4. resolver workspace PULSO;
5. verificar papel e permissão;
6. negar por padrão;
7. retornar contexto tipado.

A UI pode esconder ações, mas o servidor valida sempre.

## 6. Papéis

- owner;
- admin;
- commercial;
- projects;
- finance;
- viewer.

Permissões mínimas:

```text
dashboard.read
companies.read/create/update/delete/restore
contacts.read/create/update/delete/restore
opportunities.read/create/update/move/win/lose/delete
tasks.read/create/update/complete/delete
products.read/manage
proposals.read/create/update/publish/send/cancel
contracts.read/create/update/send/sign/cancel
projects.read/create/update/complete/delete
files.read/upload/delete
approvals.read/create/decide
finance.read/create/update/mark_paid/reverse/cancel
profitability.read_business/manage_business
profitability.read_personal/manage_personal/view_founder_summary
reports.read/reports.finance
members.read/invite/update/remove
settings.read/update
audit.read
integrations.manage
```

Centralizar em constantes tipadas.

## 7. Banco de dados

Convenções:

- UUID;
- `organization_id` ou `workspace_id` conforme estrutura atual, sem migração cosmética;
- `created_at`;
- `updated_at`;
- `deleted_at` para exclusão lógica;
- `created_by`;
- `updated_by`;
- `timestamptz` para eventos;
- `date` para vencimentos sem horário;
- `numeric` para dinheiro;
- UTC no banco;
- exibição em `America/Fortaleza`;
- índices iniciando pelo workspace quando aplicável.

Não usar `float` para dinheiro.

## 8. Transações obrigatórias

- movimentação no Kanban;
- ganho ou perda de oportunidade;
- publicação de proposta;
- aceite de proposta;
- assinatura de contrato;
- conversão de venda em projeto;
- geração de recebíveis e parcelas;
- baixa e estorno;
- alteração de papéis;
- exclusão ou restauração crítica;
- qualquer operação que também gere histórico e auditoria.

## 9. Segurança

- sem segredos no código;
- seeds por variável de ambiente;
- seed idempotente;
- produção não executa seed destrutivo;
- cookies seguros;
- rate limit;
- proteção contra enumeração de usuários;
- credenciais de integrações cifradas;
- storage privado;
- URLs assinadas;
- validação de MIME, extensão e tamanho;
- sanitização de HTML;
- proteção contra CSV formula injection;
- mascaramento de documentos;
- logs sem credenciais;
- token público forte, revogável e expirável.

## 10. Variáveis esperadas

Manter `.env.example` sem valores reais, incluindo quando aplicável:

```dotenv
NODE_ENV=development
APP_NAME=PULSO CRM
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
ENCRYPTION_KEY=
CRON_SECRET=
INTERNAL_API_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=PULSO
SMTP_FROM_EMAIL=
S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
MAX_UPLOAD_SIZE_MB=20
LOG_LEVEL=info
SEED_ADMIN_NAME=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
FEATURE_PUBLIC_PROPOSALS=true
FEATURE_PUBLIC_CONTRACTS=true
FEATURE_PUBLIC_APPROVALS=true
FEATURE_AI=false
```

Produção deve falhar com mensagem clara quando faltar variável obrigatória.
