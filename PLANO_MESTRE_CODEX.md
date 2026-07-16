# PULSO CRM — Plano Mestre de Implementação para o Codex

> **Versão:** 2.0  
> **Produto:** PULSO CRM + Portal Público de Briefings + Gerador de Orçamentos em Site  
> **Finalidade:** transformar o starter visual entregue neste pacote em um sistema completo, persistente, seguro, multiempresa e pronto para implantação.  
> **Idioma:** português do Brasil (`pt-BR`)  
> **Fuso padrão:** `America/Fortaleza`  
> **Moeda padrão:** `BRL`  
> **Princípio de execução:** evoluir o repositório existente fase a fase; não recriar tudo do zero.

---

# 1. Missão do agente

Você está trabalhando no repositório do **PULSO CRM**. O starter já possui identidade visual aprovada, shell autenticado, login demonstrativo, dashboard, Kanban visual e protótipos das novas jornadas públicas.

Sua missão é concluir um sistema que acompanhe o cliente desde a primeira resposta no site até a venda, execução, pagamento e recorrência.

O fluxo principal obrigatório é:

```text
Visitante no site da PULSO
→ escolhe um serviço ou recebe um link de briefing
→ responde perguntas públicas
→ envia dados e anexos
→ submissão chega à caixa de briefings do CRM
→ CRM identifica ou cria contato, empresa e oportunidade
→ equipe revisa e qualifica as respostas
→ equipe gera um orçamento em formato de site
→ orçamento é revisado, publicado e enviado ao cliente
→ cliente visualiza, aceita, recusa ou pede alterações
→ aceite atualiza o CRM
→ contrato, projeto e recebíveis são gerados
→ execução, aprovação, entrega e manutenção
```

Também deve existir um fluxo manual:

```text
Usuário interno cadastra ou seleciona cliente
→ preenche dados manualmente ou importa respostas existentes
→ escolhe produtos e escopo
→ gera orçamento em site
→ publica e envia
```

O formulário público não substitui o cadastro interno. O sistema deve permitir os dois modos e registrar a origem de cada dado.

---

# 2. Como o Codex deve trabalhar

## 2.1 Leitura obrigatória antes de qualquer alteração

Leia, nesta ordem:

1. `AGENTS.md`;
2. `README.md`;
3. `PLANO_MESTRE_CODEX.md`;
4. `docs/PRODUCT_REQUIREMENTS.md`, se existir;
5. `design-system/DESIGN_SYSTEM.md`;
6. `design-system/components.md`;
7. `design-system/accessibility.md`;
8. `docs/BRIEFINGS_PUBLICOS.md`;
9. `docs/ORCAMENTOS_EM_SITE.md`;
10. `docs/API_EVENTOS.md`;
11. `docs/SECURITY_PRIVACY.md`;
12. os arquivos SQL e DBML incluídos na fundação.

Inspecione a árvore do projeto e o `package.json` antes de instalar ou substituir dependências.

## 2.2 Preparação do repositório

Execute:

```bash
npm install
npm run check
```

Crie na raiz:

- `IMPLEMENTATION_STATUS.md`;
- `CHANGELOG.md`;
- `docs/adr/`;
- `docs/runbooks/`;
- `docs/openapi/`, quando a API pública for implementada.

O `IMPLEMENTATION_STATUS.md` deve conter:

- estado encontrado;
- fase atual;
- itens concluídos;
- itens pendentes;
- decisões tomadas;
- bloqueios reais;
- migrações aplicadas;
- comandos executados;
- resultado dos testes;
- próxima ação exata.

## 2.3 Regras obrigatórias de execução

1. Execute as fases na ordem definida neste documento.
2. Não avance enquanto os critérios de aceite da fase atual falharem.
3. O projeto deve compilar e iniciar ao final de cada fase.
4. Toda regra de permissão deve ser validada no servidor, não apenas escondida na interface.
5. Toda consulta multiempresa deve conter isolamento por `organization_id` ou mecanismo equivalente comprovável.
6. Não use `localStorage`, arrays fixos ou mocks como persistência final.
7. Mocks são permitidos apenas enquanto uma fase ainda não implementou o backend correspondente e devem ser marcados claramente.
8. Não coloque CPF, CNPJ, PIX, e-mail pessoal, senha, token ou chave real em código, seed, fixture ou documentação versionada.
9. Não altere os SVGs oficiais da PULSO.
10. Não troque a stack principal sem ADR e justificativa técnica.
11. Não envie e-mail, WhatsApp, contrato ou orçamento real durante testes automatizados.
12. Toda integração externa deve possuir modo sandbox ou adapter fake para testes.
13. A submissão pública deve ser idempotente e protegida contra duplicação acidental.
14. Uma proposta enviada nunca deve ser alterada silenciosamente. Mudanças relevantes geram nova versão.
15. A exclusão de dados comerciais deve preferir arquivamento ou soft delete quando houver histórico associado.
16. Ações críticas devem gerar auditoria.
17. Toda página pública deve funcionar bem em celular e não depender de login do cliente.
18. O sistema deve explicar falhas em linguagem clara sem revelar detalhes internos.

## 2.4 Rotina de encerramento de cada fase

Ao concluir uma fase:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Quando os testes E2E existirem:

```bash
npm run test:e2e
```

Depois:

- atualize `IMPLEMENTATION_STATUS.md`;
- atualize `CHANGELOG.md`;
- registre ADRs relevantes;
- documente variáveis de ambiente novas;
- registre migrações e rollback;
- deixe um checkpoint executável.

---

# 3. Estado inicial conhecido

O starter entregue contém:

- Next.js com App Router;
- React e TypeScript;
- Tailwind CSS;
- Biome;
- Vitest e Testing Library;
- rota `/login`;
- rota `/dashboard`;
- rota `/crm`;
- rota interna `/briefings`;
- rota interna `/orcamentos/novo`;
- rota pública `/solicitar/[slug]`;
- rota pública `/proposta/[token]`;
- endpoint `/api/health`;
- shell autenticado;
- Kanban visual demonstrativo;
- protótipo de caixa de briefings;
- protótipo do formulário público;
- protótipo do gerador de orçamento;
- protótipo da proposta pública;
- componentes básicos;
- identidade oficial da PULSO;
- Dockerfile;
- compose de exemplo;
- CI inicial.

O starter ainda não possui persistência real, autenticação real, upload real, envio real, regras de preço completas ou integração com o site oficial. Ele é uma fundação visual e arquitetural.

---

# 4. Resultado final obrigatório

## 4.1 Área pública

- catálogo de briefings ativos;
- link público por tipo de serviço;
- formulário em etapas;
- perguntas condicionais;
- validação progressiva;
- salvamento de rascunho;
- retomada segura;
- anexos;
- consentimento de privacidade;
- proteção antispam;
- confirmação de envio;
- acompanhamento opcional por link;
- página pública de orçamento;
- registro de visualização;
- aceite, recusa e solicitação de alterações;
- experiência responsiva e acessível.

## 4.2 Área interna

- autenticação e recuperação de senha;
- organizações, membros, papéis e permissões;
- caixa de entrada de briefings;
- revisão e triagem;
- contatos e empresas;
- oportunidades e Kanban persistente;
- catálogo de produtos;
- regras de preço e adicionais;
- criação manual de orçamento;
- criação de orçamento a partir do briefing;
- editor modular de orçamento em site;
- publicação, versão e expiração;
- propostas em PDF como saída complementar;
- contratos;
- projetos;
- tarefas;
- financeiro operacional;
- dashboards e relatórios;
- notificações;
- auditoria;
- configurações e integrações.

---

# 5. Arquitetura-alvo

## 5.1 Stack principal

Manter:

- Next.js App Router;
- React;
- TypeScript estrito;
- Tailwind CSS;
- componentes próprios alinhados ao design system;
- PostgreSQL 18;
- Drizzle ORM e Drizzle Kit;
- Better Auth;
- Zod;
- React Hook Form;
- dnd-kit;
- TanStack Table;
- TanStack Query somente onde realmente necessário;
- date-fns;
- storage S3 compatível;
- SMTP por provider;
- geração de PDF no servidor;
- Docker;
- Dokploy;
- Cloudflare;
- GitHub Actions.

## 5.2 Organização de camadas

Utilize uma estrutura próxima de:

```text
src/
  app/
    (auth)/
    (app)/
    (public)/
    api/
  components/
    ui/
    crm/
    briefings/
    proposals/
    public/
  features/
    auth/
    organizations/
    contacts/
    companies/
    opportunities/
    briefings/
    proposals/
    contracts/
    projects/
    finance/
  server/
    auth/
    db/
    permissions/
    services/
    repositories/
    jobs/
    integrations/
  lib/
  emails/
  tests/
```

Não é obrigatório copiar exatamente os nomes, mas é obrigatório separar UI, regras de negócio, persistência e integrações.

## 5.3 Domínios principais

- Identity & Access;
- Organization;
- CRM;
- Briefing Builder;
- Public Submission;
- Product Catalog;
- Pricing;
- Proposal Site;
- Contract;
- Project Delivery;
- Finance;
- Files;
- Notifications;
- Audit;
- Integrations.

## 5.4 Modelo multiempresa

Todos os dados internos pertencem a uma organização. O sistema começa com a organização PULSO, mas deve estar preparado para outras organizações no futuro.

Regras:

- `organization_id` obrigatório nos registros de negócio;
- contexto da organização resolvido na sessão;
- repositórios recebem explicitamente a organização;
- testes devem tentar acessar IDs de outra organização;
- links públicos resolvem a organização pelo token, nunca por parâmetro manipulável do usuário;
- arquivos devem usar prefixo por organização;
- jobs devem carregar o contexto correto.

---

# 6. Modelo de jornada pública de briefing

## 6.1 Tipos iniciais de briefing

Criar templates iniciais para:

1. Link na Bio e Cartão Digital;
2. Catálogo Digital;
3. Site Essencial;
4. Landing Page;
5. Site Institucional;
6. Loja Virtual;
7. Integração com IA;
8. Automação de Processos;
9. Sistema Web, CRM, SaaS ou White Label;
10. Briefing genérico configurável.

## 6.2 Estrutura de perguntas

Uma pergunta deve suportar:

- texto curto;
- texto longo;
- e-mail;
- telefone/WhatsApp;
- URL;
- número;
- moeda;
- data;
- escolha única;
- múltipla escolha;
- seleção em lista;
- sim/não;
- escala;
- arquivo;
- consentimento;
- bloco informativo sem resposta.

Campos de uma pergunta:

- ID estável;
- chave semântica;
- título;
- descrição de apoio;
- tipo;
- obrigatório;
- placeholder;
- opções;
- validação;
- ordem;
- seção;
- regra de visibilidade;
- mapeamento para CRM;
- sensibilidade do dado;
- possibilidade de uso no orçamento;
- possibilidade de exibição pública na proposta.

## 6.3 Condicionais

Exemplos:

- mostrar perguntas sobre domínio somente quando o cliente já tiver domínio;
- mostrar integração de pagamento quando houver venda online;
- mostrar número de usuários quando for sistema;
- mostrar upload de identidade quando o cliente indicar que já possui marca;
- mostrar pergunta de migração quando já existir site ou sistema.

As regras devem ser armazenadas em estrutura versionável e validadas no servidor.

## 6.4 Rascunho e retomada

O cliente pode:

- iniciar sem conta;
- salvar automaticamente;
- receber link de retomada por e-mail ou WhatsApp;
- continuar em outro dispositivo;
- finalizar apenas após validação;
- revisar respostas antes de enviar.

O token de retomada deve ser aleatório, armazenado de forma segura, revogável e com expiração. Não incluir e-mail ou documento na URL.

## 6.5 Envio e ingestão no CRM

Ao enviar:

1. validar schema e regras condicionais no servidor;
2. validar captcha/antispam;
3. registrar consentimentos;
4. persistir snapshot do template e respostas;
5. deduplicar contato e empresa de forma assistida;
6. criar ou vincular oportunidade;
7. registrar origem `public_briefing`;
8. atribuir ao funil e etapa configurados;
9. criar atividade de envio;
10. notificar responsáveis;
11. retornar protocolo ao cliente.

Não mesclar automaticamente contatos ambíguos. Criar alerta para revisão.

---

# 7. Orçamento em formato de site

## 7.1 Conceito

O orçamento será uma proposta comercial interativa, publicada como página web pública, com identidade visual, conteúdo modular, validade e ações rastreáveis.

Não é apenas um PDF hospedado. O cliente deve conseguir navegar pelo escopo, investimento e condições e responder diretamente na página.

## 7.2 Fontes de dados

O orçamento pode ser criado por três caminhos:

### A. A partir de briefing

- selecionar uma submissão;
- importar cliente, empresa, necessidades, objetivos, prazo, referências e anexos;
- sugerir produtos e escopo;
- permitir revisão humana antes de salvar.

### B. A partir de oportunidade

- selecionar oportunidade existente;
- importar contato, empresa, produtos e histórico;
- escolher um briefing relacionado ou ignorar.

### C. Manual

- digitar ou selecionar todos os dados;
- adicionar cliente novo sem briefing;
- criar proposta livre ou baseada em template.

Cada campo deve registrar sua origem quando relevante: `briefing`, `crm`, `manual`, `product_catalog`, `ai_suggestion`.

## 7.3 Editor de proposta

O editor deve utilizar blocos ordenáveis:

- capa;
- apresentação da PULSO;
- contexto entendido;
- objetivos;
- diagnóstico;
- solução recomendada;
- itens de escopo;
- entregáveis;
- itens não incluídos;
- etapas e cronograma;
- investimento;
- opções de pagamento;
- adicionais opcionais;
- responsabilidades do cliente;
- garantia e suporte;
- manutenção;
- FAQ;
- validade;
- termos resumidos;
- CTA de aceite;
- contato.

Cada bloco pode ser:

- ativado/desativado;
- reordenado;
- duplicado quando permitido;
- editado;
- restaurado para o padrão do template.

## 7.4 Regras de cálculo

- subtotal calculado pelos itens;
- quantidade e unidade configuráveis;
- desconto por item e global;
- adicionais opcionais não entram no total até seleção do cliente, caso a proposta permita;
- entrada, parcelas e vencimentos estimados;
- impostos e custos externos podem ser incluídos ou informados separadamente;
- arredondamento consistente em centavos;
- total recalculado no servidor;
- nenhuma confiança em valores enviados pelo navegador;
- descontos acima do limite exigem permissão ou aprovação.

## 7.5 Publicação e versões

Estados mínimos:

```text
draft → ready → published → viewed → accepted | rejected | changes_requested | expired | cancelled
```

Regras:

- rascunho pode mudar livremente;
- publicação cria versão imutável;
- alteração após envio cria nova versão;
- versão antiga continua auditável;
- apenas uma versão pode estar ativa para aceite;
- validade pode expirar por job;
- token público pode ser revogado;
- versão aceita não pode ser substituída silenciosamente.

## 7.6 Página pública

Rota sugerida:

```text
/proposta/{token}
```

ou domínio dedicado no futuro:

```text
orcamento.pulso.cloud/p/{token}
```

A página deve exibir:

- marca da organização;
- nome do cliente ou empresa de forma adequada;
- versão e validade;
- seções do orçamento;
- investimento claro;
- opções de pagamento;
- anexos públicos, quando marcados como públicos;
- botões aceitar, solicitar alteração e recusar;
- contato via WhatsApp;
- aviso de privacidade;
- confirmação antes de ações definitivas.

Nunca exibir CPF, dados bancários completos, notas internas ou respostas sensíveis do briefing.

## 7.7 Eventos rastreados

- publicado;
- enviado;
- primeira visualização;
- visualizações subsequentes;
- seção visitada, apenas se realmente útil e com privacidade adequada;
- download de PDF;
- clique no WhatsApp;
- seleção de adicional;
- solicitação de alteração;
- recusa;
- aceite;
- expiração;
- revogação.

Evite rastreamento invasivo. Não dependa de fingerprinting.

## 7.8 Aceite

O aceite deve coletar:

- nome;
- e-mail;
- cargo ou relação com a empresa, quando aplicável;
- declaração explícita;
- data e hora;
- IP;
- user agent;
- versão aceita;
- hash do snapshot aceito;
- opção de pagamento escolhida;
- adicionais escolhidos;
- consentimentos necessários.

O aceite comercial não deve ser tratado automaticamente como assinatura jurídica completa sem que os requisitos legais do contrato sejam atendidos. Ele pode disparar a geração do contrato.

---

# 8. Fases de implementação

# Fase 0 — Baseline, higiene e documentação

## Objetivo

Garantir que o repositório recebido seja compreendido, reproduzível e seguro para evolução.

## Entregas

- leitura dos arquivos obrigatórios;
- inventário do starter;
- `IMPLEMENTATION_STATUS.md`;
- `CHANGELOG.md`;
- estrutura de ADRs e runbooks;
- atualização de dependências somente quando necessária;
- correção de warnings de baseline;
- verificação do Dockerfile;
- `.env.example` completo e sem segredos;
- scripts padronizados.

## Critérios de aceite

- `npm run check` passa;
- `docker build` passa;
- `/api/health` responde;
- nenhum segredo real está versionado;
- estado inicial está documentado.

## Prompt sugerido ao Codex

> Execute apenas a Fase 0 do `PLANO_MESTRE_CODEX.md`. Inspecione o repositório, crie os arquivos de acompanhamento, corrija somente problemas de baseline e encerre com todos os checks passando. Não implemente funcionalidades das fases seguintes.

---

# Fase 1 — Banco, ORM, migrações e isolamento multiempresa

## Objetivo

Substituir dados demonstrativos por uma base PostgreSQL preparada para toda a aplicação.

## Entregas

- Drizzle ORM e Drizzle Kit;
- conexão PostgreSQL;
- schema modular;
- migração inicial;
- seeds mínimos sem PII real;
- organização de desenvolvimento;
- repositórios com escopo por organização;
- testes de isolamento;
- transações para operações críticas;
- estratégia de soft delete;
- função comum de `updated_at` ou equivalente;
- índices do schema V2.

## Critérios de aceite

- banco vazio sobe com migrações;
- seed cria dados fictícios;
- duas organizações de teste não acessam dados uma da outra;
- não existe acesso direto ao banco a partir de componentes client;
- IDs e tokens são gerados de forma segura.

## Prompt sugerido

> Execute apenas a Fase 1. Implemente PostgreSQL, Drizzle, migrações, seed fictício e isolamento multiempresa conforme o schema V2. Escreva testes de cross-tenant. Não implemente autenticação ainda além do necessário para testes de repositório.

---

# Fase 2 — Autenticação, sessões, organizações, membros e RBAC

## Objetivo

Criar acesso real e controle de permissões.

## Entregas

- Better Auth;
- login por e-mail e senha;
- logout;
- recuperação e redefinição de senha;
- verificação de e-mail, quando configurada;
- sessões;
- organização ativa;
- membros;
- convites;
- papéis;
- permissões por módulo e ação;
- proteção de rotas;
- auditoria de autenticação;
- rate limit de login.

## Critérios de aceite

- usuário não autenticado não acessa área interna;
- usuário suspenso perde acesso;
- permissão é validada no servidor;
- tokens de recuperação expiram e são de uso único;
- sessão pode ser revogada.

---

# Fase 3 — Configurações públicas e construtor de briefings

## Objetivo

Permitir que a PULSO crie e publique formulários de briefing sem alterar código.

## Entregas

- módulo `Briefings > Templates`;
- tipos de pergunta;
- seções;
- ordenação;
- obrigatoriedade;
- validações;
- opções;
- condicionais;
- preview;
- rascunho e publicação;
- versionamento;
- clonagem;
- slug público;
- tema e textos públicos;
- vínculo com produto, funil e etapa;
- configuração de criação automática de oportunidade;
- templates iniciais da PULSO.

## Critérios de aceite

- administrador cria template sem código;
- versão publicada não muda quando o rascunho é editado;
- preview respeita condicionais;
- slug não colide dentro da organização;
- pergunta removida de nova versão não apaga respostas antigas.

---

# Fase 4 — Portal público de briefing

## Objetivo

Disponibilizar formulários seguros, responsivos e fáceis de responder.

## Entregas

- rota pública `/solicitar/[slug]`;
- carregamento da versão publicada;
- wizard em etapas;
- barra de progresso;
- validação por etapa e final;
- autosave;
- token de retomada;
- revisão antes do envio;
- anexos com upload seguro;
- consentimento;
- página de sucesso;
- protocolo;
- captcha/antispam;
- rate limit;
- acessibilidade;
- testes em celular.

## Critérios de aceite

- formulário funciona sem login;
- respostas condicionais são validadas no servidor;
- upload recusa tipo e tamanho inválidos;
- refresh não perde rascunho persistido;
- envio duplicado com mesma chave idempotente não cria dois registros;
- página não expõe dados de outra submissão.

---

# Fase 5 — Ingestão, deduplicação e caixa de briefings

## Objetivo

Transformar submissões públicas em trabalho comercial organizado.

## Entregas

- caixa de entrada de briefings;
- filtros por status, produto, data, origem e responsável;
- detalhe da submissão;
- visualização de respostas por seção;
- anexos;
- score de completude;
- alertas de duplicidade;
- vincular ou criar contato;
- vincular ou criar empresa;
- vincular ou criar oportunidade;
- atribuição de responsável;
- notas internas;
- status de triagem;
- auditoria;
- notificação interna.

Estados sugeridos:

```text
started → submitted → under_review → qualified → linked → proposal_created → archived | spam
```

## Critérios de aceite

- envio público aparece no CRM;
- vínculo manual não duplica contato;
- sugestão de duplicidade não faz merge sem confirmação;
- notas internas não aparecem ao cliente;
- toda vinculação fica no histórico.

---

# Fase 6 — CRM principal: contatos, empresas, funis e oportunidades

## Objetivo

Concluir o núcleo comercial persistente.

## Entregas

- contatos;
- empresas;
- relação empresa-contato;
- visão 360º;
- produtos de interesse;
- origens;
- tags;
- funis configuráveis;
- etapas;
- oportunidades;
- Kanban com dnd-kit;
- ordenação persistente;
- lista alternativa;
- filtros;
- busca;
- próxima ação;
- atividades;
- histórico de etapa;
- ganho e perda;
- motivos de perda;
- tarefas vinculadas.

## Critérios de aceite

- arrastar card persiste e gera histórico;
- conflito de ordenação é tratado;
- motivo é obrigatório para perda;
- oportunidade aberta sem próxima ação aparece em alerta;
- briefing vinculado aparece na visão da oportunidade.

---

# Fase 7 — Catálogo de produtos, escopos e motor de preços

## Objetivo

Centralizar produtos da PULSO e permitir composição confiável de orçamento.

## Entregas

- produtos e categorias;
- preço inicial;
- unidade;
- prazo médio;
- escopo padrão;
- inclusões e exclusões;
- adicionais;
- dependências;
- regras de quantidade;
- regras condicionais de preço;
- custos externos;
- planos mensais;
- limite de desconto;
- aprovação de desconto;
- templates por produto;
- importação dos produtos atuais da PULSO.

## Critérios de aceite

- cálculo é reproduzível no servidor;
- histórico mantém valor aplicado na data da proposta;
- alteração futura do produto não altera proposta enviada;
- desconto acima da permissão é bloqueado.

---

# Fase 8 — Gerador interno de orçamento em site

## Objetivo

Permitir criar propostas públicas a partir de briefing, oportunidade ou dados manuais.

## Entregas

- rota interna `/orcamentos/novo`;
- seleção de origem;
- importação de briefing;
- importação de oportunidade;
- cadastro manual;
- seleção de cliente e contato;
- itens e adicionais;
- editor de blocos;
- timeline;
- opções de pagamento;
- validade;
- preview desktop e mobile;
- autosave;
- validação antes de publicar;
- notas internas;
- origem de cada campo;
- criação de versão.

## Critérios de aceite

- usuário gera proposta sem briefing;
- usuário gera proposta a partir de briefing sem recadastrar dados;
- importação não sobrescreve alterações manuais sem confirmação;
- totais do editor e servidor coincidem;
- rascunho é recuperável.

---

# Fase 9 — Publicação e página pública de orçamento

## Objetivo

Entregar ao cliente uma proposta web clara, segura e rastreável.

## Entregas

- token público;
- publicação de snapshot imutável;
- rota `/proposta/[token]`;
- tema PULSO;
- navegação por seções;
- investimento;
- pagamentos;
- adicionais opcionais;
- anexos públicos;
- validade;
- download de PDF;
- WhatsApp;
- eventos de visualização;
- expiração;
- revogação;
- proteção contra enumeração.

## Critérios de aceite

- token inválido retorna página neutra;
- proposta expirada não aceita ação;
- dados internos não são serializados na página;
- primeira visualização atualiza o CRM;
- versão publicada permanece idêntica ao snapshot.

---

# Fase 10 — Respostas do cliente: aceite, recusa e alterações

## Objetivo

Fechar o ciclo comercial dentro da proposta pública.

## Entregas

- modal de aceite;
- aceite de termos;
- nome e e-mail;
- opção de pagamento;
- seleção de adicionais, quando habilitada;
- recusa com motivo opcional ou obrigatório conforme configuração;
- solicitação de alteração com mensagem;
- confirmação por e-mail;
- eventos;
- atualização da oportunidade;
- tarefas automáticas;
- bloqueio de duplo aceite;
- hash do snapshot aceito.

## Critérios de aceite

- aceite registra versão exata;
- resposta é idempotente;
- oportunidade muda conforme automação configurada;
- solicitação de alteração não altera a versão por si só;
- usuário interno recebe notificação.

---

# Fase 11 — Envio, e-mails, PDF e comunicação

## Objetivo

Permitir distribuição profissional e rastreável.

## Entregas

- templates de e-mail;
- envio de link;
- reenvio;
- lembrete manual;
- lembrete automático configurável;
- adapter de WhatsApp por link na primeira versão;
- provider real opcional no futuro;
- PDF do snapshot;
- registro de envio e falha;
- fila de jobs;
- retries;
- unsubscribe quando aplicável.

## Critérios de aceite

- envio não bloqueia requisição web;
- falha é reprocessável;
- PDF corresponde à versão publicada;
- testes usam provider fake.

---

# Fase 12 — Contratos e evidências

## Objetivo

Gerar contratos a partir de propostas aceitas e acompanhar assinatura.

## Entregas

- modelos;
- variáveis;
- geração a partir do snapshot;
- revisão;
- versão;
- página pública;
- assinatura/aceite conforme estratégia jurídica;
- evidências;
- anexos;
- status;
- auditoria;
- integração futura com assinatura externa por adapter.

## Critérios de aceite

- contrato herda proposta aceita;
- alterações geram nova versão;
- evidência contém versão e hash;
- dados sensíveis são protegidos.

---

# Fase 13 — Projetos, tarefas, aprovações e entrega

## Objetivo

Converter venda em execução acompanhável.

## Entregas

- conversão automática ou assistida;
- etapas de projeto;
- responsáveis;
- tarefas;
- checklists;
- materiais pendentes;
- arquivos;
- acessos do cliente;
- marcos;
- aprovação pública;
- solicitações de alteração;
- publicação;
- handoff;
- garantia;
- manutenção.

## Critérios de aceite

- venda gera projeto sem duplicação;
- pendência do cliente aparece claramente;
- aprovação registra versão e evidência;
- tarefas e prazos alimentam dashboard.

---

# Fase 14 — Financeiro operacional

## Objetivo

Acompanhar recebíveis e recorrência sem tentar substituir contabilidade.

## Entregas

- recebíveis;
- parcelas;
- entrada;
- vencimentos;
- baixas;
- comprovantes;
- conta de recebimento;
- PIX mascarado;
- atrasos;
- receita prevista e recebida;
- custos externos;
- margem estimada;
- planos mensais;
- MRR;
- exportação.

## Critérios de aceite

- valores conciliam com proposta aceita;
- baixa exige permissão;
- cancelamento não apaga histórico;
- dados bancários completos não aparecem para perfis sem acesso.

---

# Fase 15 — Dashboard, busca, relatórios e notificações

## Objetivo

Transformar dados em próximas ações e gestão.

## Entregas

- central “precisa da sua atenção”;
- briefings novos;
- leads sem retorno;
- propostas sem resposta;
- propostas visualizadas sem aceite;
- contratos pendentes;
- tarefas vencidas;
- materiais pendentes;
- parcelas vencidas;
- métricas de conversão;
- origem de leads;
- produtos vendidos;
- ticket médio;
- tempo até proposta;
- tempo até fechamento;
- busca global;
- notificações in-app;
- preferências.

## Critérios de aceite

- indicadores usam somente dados autorizados;
- cada alerta leva ao registro correto;
- filtros possuem fuso correto;
- cálculos possuem testes.

---

# Fase 16 — Automações e integrações

## Objetivo

Reduzir trabalho repetitivo sem perder controle.

## Entregas

- regras de automação;
- gatilhos por evento;
- ações de criar tarefa, notificar, mudar etapa e gerar rascunho;
- webhooks de saída;
- endpoint seguro de entrada;
- integração futura com site oficial;
- importação de formulários externos;
- adapters SMTP, storage, assinatura e WhatsApp;
- segredos criptografados;
- logs e retries.

## Critérios de aceite

- automação possui log;
- falha não duplica ação;
- webhook tem assinatura;
- segredo não é devolvido pela API.

---

# Fase 17 — Assistência por IA com revisão humana

## Objetivo

Acelerar análise e redação sem permitir decisões irreversíveis automáticas.

## Recursos permitidos

- resumir briefing;
- sugerir perguntas faltantes;
- sugerir produto;
- sugerir escopo;
- rascunhar texto do orçamento;
- gerar checklist inicial;
- resumir histórico;
- sugerir follow-up.

## Regras

- recurso atrás de feature flag;
- nunca publicar proposta sozinho;
- nunca definir preço final sem regra e revisão;
- registrar provider, modelo, prompt versionado e usuário aprovador;
- evitar enviar PII desnecessária;
- permitir desativação por organização;
- respostas marcadas como sugestão.

## Critérios de aceite

- saída exige confirmação;
- falha do provider não bloqueia fluxo manual;
- prompt injection em resposta pública não ganha acesso a ferramentas internas;
- testes usam adapter fake.

---

# Fase 18 — Segurança, LGPD, acessibilidade e qualidade

## Objetivo

Endurecer o produto antes de produção.

## Entregas

- threat model;
- revisão de autorização;
- rate limit;
- CSP;
- proteção CSRF onde aplicável;
- cookies seguros;
- validação de upload;
- antivírus ou quarentena planejada;
- retenção e exclusão;
- exportação de dados;
- registro de consentimentos;
- política de logs;
- auditoria de dependências;
- testes unitários, integração, componentes e E2E;
- WCAG 2.2 AA nas jornadas principais;
- testes de teclado;
- testes de contraste;
- testes de responsividade.

## Critérios de aceite

- nenhuma vulnerabilidade crítica conhecida;
- teste de acesso cruzado falha como esperado;
- páginas públicas funcionam com teclado;
- uploads privados usam URL assinada e curta;
- procedimento de incidente está documentado.

---

# Fase 19 — Deploy, observabilidade, backup e recuperação

## Objetivo

Publicar de forma reproduzível e recuperável.

## Entregas

- imagem Docker de produção;
- deploy no Dokploy;
- PostgreSQL privado;
- storage S3 compatível;
- Cloudflare;
- domínio interno e público;
- health, readiness e version endpoints;
- logs estruturados;
- rastreamento de erros;
- métricas essenciais;
- backup automático;
- teste de restauração;
- rollback;
- migração segura;
- runbook de deploy e incidente.

## Critérios de aceite

- deploy reproduzível;
- migração roda antes da aplicação receber tráfego ou por estratégia segura equivalente;
- backup restaurado em ambiente de teste;
- health check não depende de dados privados;
- rollback documentado e testado.

---

# 9. Rotas mínimas

## Públicas

```text
/solicitar
/solicitar/[slug]
/retomar/[token]
/envio/[protocol]
/proposta/[token]
/proposta/[token]/aceitar
/proposta/[token]/alteracao
/proposta/[token]/recusar
/contrato/[token]
/aprovacao/[token]
```

## Autenticadas

```text
/login
/esqueci-senha
/redefinir-senha
/dashboard
/briefings
/briefings/templates
/briefings/templates/novo
/briefings/templates/[id]
/briefings/submissoes/[id]
/crm
/contatos
/contatos/[id]
/empresas
/empresas/[id]
/oportunidades/[id]
/produtos
/orcamentos
/orcamentos/novo
/orcamentos/[id]
/orcamentos/[id]/editor
/contratos
/projetos
/tarefas
/financeiro
/relatorios
/configuracoes
/configuracoes/equipe
/configuracoes/permissoes
/configuracoes/integracoes
/auditoria
```

---

# 10. Entidades de dados obrigatórias

Além das entidades clássicas do CRM, implemente:

- `briefing_templates`;
- `briefing_template_versions`;
- `briefing_sections`;
- `briefing_questions`;
- `briefing_question_options`;
- `briefing_logic_rules`;
- `briefing_submissions`;
- `briefing_submission_answers`;
- `briefing_submission_files` ou relação por attachments;
- `briefing_resume_tokens`;
- `consent_records`;
- `proposal_templates`;
- `proposals`;
- `proposal_versions`;
- `proposal_blocks`;
- `proposal_items`;
- `proposal_payment_options`;
- `proposal_public_links`;
- `proposal_events`;
- `proposal_responses`;
- `proposal_selected_addons`;
- `field_origins` ou metadados equivalentes;
- `idempotency_keys`;
- `outbox_events`;
- `jobs` ou integração equivalente com fila.

O schema SQL V2 deste pacote é referência conceitual. O Codex pode modularizar o schema no ORM, mas não deve remover regras sem justificar.

---

# 11. Eventos de domínio mínimos

```text
briefing.template_published
briefing.draft_started
briefing.draft_saved
briefing.submitted
briefing.flagged_as_duplicate
briefing.linked_to_opportunity
briefing.qualified
opportunity.created
opportunity.stage_changed
opportunity.won
opportunity.lost
proposal.draft_created
proposal.version_created
proposal.published
proposal.sent
proposal.viewed
proposal.changes_requested
proposal.rejected
proposal.accepted
proposal.expired
contract.created
contract.signed
project.created
payment.due
payment.paid
payment.overdue
```

Eventos importantes devem ser persistidos ou enviados por outbox transacional para evitar perda entre banco e jobs.

---

# 12. Segurança e privacidade específicas

## Briefings públicos

- captcha adaptativo;
- rate limit por IP e token;
- honeypot;
- upload com allowlist de MIME e extensão;
- tamanho máximo configurável;
- nome do arquivo sanitizado;
- storage privado;
- URL assinada;
- token de retomada com expiração;
- não revelar se um e-mail já existe;
- consentimento versionado;
- retenção de rascunhos não enviados;
- exclusão ou anonimização conforme política.

## Propostas públicas

- token de alta entropia;
- comparação segura;
- revogação;
- expiração;
- sem IDs sequenciais;
- sem dados internos no HTML;
- cabeçalhos de segurança;
- proteção contra indexação;
- ações definitivas com confirmação;
- rate limit de respostas;
- snapshot e hash.

## Logs

Não registrar:

- senha;
- token completo;
- conteúdo integral de arquivos;
- CPF completo sem necessidade;
- respostas sensíveis em logs;
- segredos de integração.

---

# 13. Testes obrigatórios

## Unitários

- regras condicionais de briefing;
- validação de resposta;
- cálculo de proposta;
- desconto;
- parcelas;
- expiração;
- permissões;
- deduplicação assistida;
- normalização de telefone, e-mail e documento.

## Integração

- submissão pública completa;
- idempotência;
- criação ou vínculo de oportunidade;
- publicação de proposta;
- evento de primeira visualização;
- aceite;
- outbox;
- upload.

## Componentes

- wizard;
- editor de perguntas;
- editor de proposta;
- Kanban;
- modais de resposta pública;
- estados vazios e de erro.

## E2E

1. administrador publica briefing;
2. cliente responde e envia;
3. submissão aparece no CRM;
4. usuário vincula/cria oportunidade;
5. usuário gera orçamento a partir do briefing;
6. usuário publica;
7. cliente visualiza;
8. cliente solicita alteração;
9. usuário publica nova versão;
10. cliente aceita;
11. CRM registra aceite e cria próxima ação.

Criar também E2E do caminho manual sem briefing.

---

# 14. Definition of Done global

Uma funcionalidade só está concluída quando:

- possui validação de entrada;
- possui autorização no servidor;
- respeita organização;
- possui estado de carregamento;
- possui estado vazio;
- possui estado de erro;
- funciona em mobile quando aplicável;
- possui acessibilidade básica;
- possui testes proporcionais ao risco;
- possui auditoria quando crítica;
- está documentada;
- passa em build e checks;
- não depende de segredo real no repositório.

---

# 15. Ordem recomendada de execução no Codex

Não entregue o plano inteiro em um único pedido. Execute uma fase por vez.

Modelo de prompt:

```text
Leia AGENTS.md, README.md e PLANO_MESTRE_CODEX.md.
Execute exclusivamente a Fase X.
Antes de alterar, inspecione o estado atual e atualize IMPLEMENTATION_STATUS.md.
Implemente todos os itens e critérios de aceite da fase.
Não avance para a fase seguinte.
Execute os checks, documente decisões e deixe o projeto compilável.
Ao final, relate arquivos alterados, migrações, testes e pendências reais.
```

Para fases grandes, divida por entregas internas, mas mantenha o critério de aceite completo antes de declarar a fase concluída.

---

# 16. Decisões que não devem ser improvisadas

O Codex deve pedir confirmação antes de:

- contratar ou escolher serviço pago definitivo;
- trocar banco, ORM ou framework;
- enviar mensagens reais para clientes;
- alterar domínio em produção;
- apagar dados existentes;
- aplicar migração destrutiva;
- habilitar assinatura com validade jurídica específica;
- habilitar IA com dados reais;
- publicar o sistema em produção;
- modificar política de retenção;
- tornar arquivos privados publicamente acessíveis.

Para todo o restante, use as decisões deste documento e siga em frente.

---

# 17. Marco de produto por versão

## V0.1 — Fundação real

Fases 0 a 2.

## V0.2 — Captação por briefing

Fases 3 a 5.

## V0.3 — CRM operacional

Fases 6 e 7.

## V0.4 — Orçamentos em site

Fases 8 a 11.

## V0.5 — Venda até entrega

Fases 12 a 15.

## V0.6 — Automação e IA assistida

Fases 16 e 17.

## V1.0 — Produção endurecida

Fases 18 e 19 concluídas, com restauração testada e jornadas E2E aprovadas.

---

# 18. Resultado esperado da experiência

Para o cliente, a experiência deve parecer simples:

> responder → receber uma proposta clara → decidir.

Para a PULSO, o sistema deve preservar toda a complexidade necessária:

> origem → dados → histórico → cálculo → versão → evidência → operação → recebimento.

A interface nunca deve obrigar o cliente a entender a estrutura interna do CRM. O CRM, por sua vez, nunca deve depender apenas do que aparece na interface pública.
