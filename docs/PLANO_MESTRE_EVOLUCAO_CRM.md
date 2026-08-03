# Plano Mestre de Evolução do PULSO CRM

Status: **PLAN_READY**  
Versão: **1.0**  
Data-base: **2026-08-02**  
Produto: **PULSO CRM**  
Produção: **https://crm.pulsosh.cloud**  
Repositório: **PULSOsh/Pulso-CRM**  
Público-alvo deste documento: **Claude/Codex, Produto, Engenharia, QA, Segurança e DevOps**

## 1. Missão

Evoluir o CRM atual para o sistema operacional completo da Pulso, cobrindo:

1. aquisição e qualificação;
2. briefing e diagnóstico;
3. proposta, negociação e aceite;
4. contrato e assinatura;
5. projeto, tarefas e aprovações;
6. financeiro empresarial;
7. finanças pessoais isoladas;
8. atendimento, documentos, automações, indicadores e auditoria.

A evolução deve preservar o que já funciona, ativar recursos existentes que estão incompletos e adicionar novos módulos por entregas pequenas, testáveis, reversíveis e publicáveis.

## 2. Regras para o Claude executar este plano

O Claude deve:

- tratar este documento como plano diretor, não como autorização para um big bang;
- executar uma story por vez, em branch ou worktree isolada;
- confirmar no código e no banco o estado real antes de alterar;
- reutilizar tabelas, actions, componentes e padrões existentes;
- preferir migrações aditivas e compatíveis com rollback;
- nunca misturar dados financeiros pessoais e empresariais;
- nunca inserir credenciais, tokens ou segredos no Git;
- implementar autorização por organização em toda leitura e escrita;
- criar testes da regra de negócio antes de marcar a story concluída;
- atualizar a story e a documentação após cada entrega;
- interromper o deploy diante de falha crítica de segurança, migração ou integridade;
- publicar somente após typecheck, testes, build, revisão de segurança e plano de rollback.

## 3. Escala de estado dos módulos

Cada módulo deve receber um dos estados:

- **Código existente:** há tabelas, páginas ou actions, sem garantia de uso.
- **Publicado:** a rota responde em produção.
- **Ativo:** o fluxo principal funciona com dados reais.
- **Validado:** fluxo feliz, erros, autorização e regressão foram testados.
- **Concluído:** atende todos os critérios funcionais e operacionais.

Uma rota publicada não deve ser chamada de módulo concluído sem evidências de teste.

## 4. Inventário atual confirmado

### 4.1 Base e acesso

Existem no projeto:

- autenticação Better Auth;
- usuários, organizações, memberships, papéis e permissões;
- isolamento por organização em várias actions;
- login, dashboard e shell de navegação;
- seed de organização, owner, credencial, permissões e papéis;
- páginas amigáveis para erros de aplicação.

Estado recomendado: **publicado e parcialmente validado**.

Pendências:

- auditoria sistemática de autorização em todas as actions;
- gestão visual de usuários, convites, papéis e permissões;
- recuperação de senha e sessão;
- observabilidade de autenticação;
- testes negativos entre organizações.

### 4.2 Comercial

Existem:

- contatos e empresas;
- pipelines, etapas e oportunidades;
- Kanban com movimentação;
- produtos vinculados à oportunidade;
- atividades, próxima ação, ganho e perda;
- propostas/orçamentos ligados à oportunidade.

Estado recomendado: **publicado, parcialmente ativo**.

Pendências:

- múltiplos funis configuráveis;
- criação e edição de etapas;
- motivos de perda configuráveis;
- importação e deduplicação;
- metas, responsáveis, forecast e SLA;
- teste ponta a ponta completo.

### 4.3 Tarefas e atividades

Existem:

- tarefas;
- atividades e notas;
- vínculo com oportunidade;
- indicadores de tarefas abertas.

Estado recomendado: **código existente/publicado**.

Pendências:

- conclusão e reabertura auditáveis;
- recorrência;
- calendário;
- lembretes;
- visão “minhas tarefas”;
- filtros, prioridades e responsáveis;
- automação da próxima ação.

### 4.4 Briefings

Existem:

- templates;
- formulário público;
- caixa de entrada;
- detalhes da submissão;
- conversão/vínculo com oportunidade.

Estado recomendado: **publicado, não totalmente validado**.

Pendências:

- construtor completo de perguntas e seções;
- lógica condicional;
- autosave;
- anexos;
- versionamento;
- comentários internos;
- SLA, responsável e solicitação de complemento;
- transformação do briefing em escopo de proposta.

### 4.5 Propostas e orçamentos

Existem:

- catálogo de produtos;
- criação e edição;
- itens;
- página pública;
- aprovação/aceite;
- versões e eventos em partes do fluxo.

Estado recomendado: **publicado, parcialmente ativo**.

Pendências:

- versionamento imutável;
- opcionais;
- impostos, descontos e condições;
- PDF;
- eventos de abertura;
- recusa e pedido de alteração;
- expiração;
- geração transacional de contrato, projeto e recebível.

### 4.6 Contratos

Existem:

- listagem e detalhes;
- página pública por token;
- aceite/assinatura e cancelamento em partes do fluxo.

Estado recomendado: **publicado, parcialmente ativo**.

Pendências:

- templates e variáveis;
- evidências de assinatura;
- versionamento;
- renovação;
- alertas de vencimento;
- anexos;
- trilha de auditoria;
- integração robusta com proposta e projeto.

### 4.7 Projetos e entrega

Existem:

- projetos;
- etapas;
- checklist;
- arquivos;
- aprovações;
- vínculo com contrato/oportunidade.

Estado recomendado: **publicado, parcialmente ativo**.

Pendências:

- geração automática a partir do escopo;
- marcos;
- dependências;
- responsáveis;
- calendário;
- controle de horas;
- alteração de escopo;
- portal do cliente;
- encerramento e avaliação.

### 4.8 Financeiro e lucratividade

Existem:

- recebíveis;
- parcelas;
- custos;
- financeiro;
- lucratividade;
- relatórios iniciais.

Estado recomendado: **publicado, incompleto**.

Pendências:

- contas a pagar;
- contas bancárias e caixas;
- categorias e centros de custo;
- fornecedores;
- conciliação;
- recorrência;
- fluxo de caixa;
- DRE;
- baixa parcial;
- juros, multas e descontos;
- anexos e comprovantes;
- auditoria financeira.

## 5. Arquitetura funcional alvo

### Módulo A — Administração e segurança

- organizações e workspaces;
- usuários, convites e equipes;
- RBAC por módulo e operação;
- sessões e dispositivos;
- logs de auditoria;
- preferências;
- feature flags;
- backup e restauração administrativa.

### Módulo B — CRM comercial

- contatos, empresas e relacionamentos;
- múltiplos funis;
- etapas configuráveis;
- oportunidades;
- origem, campanhas e indicação;
- motivos de perda;
- atividades, follow-ups e forecast;
- importação, exportação, merge e deduplicação.

### Módulo C — Agenda e produtividade

- tarefas pessoais e de equipe;
- recorrência;
- agenda diária, semanal e mensal;
- lembretes;
- prioridades;
- dependências;
- modelos de checklist;
- registro de conclusão e reabertura;
- sincronização futura com calendários externos.

### Módulo D — Briefing e diagnóstico

- templates versionados;
- seções e perguntas;
- lógica condicional;
- formulário público seguro;
- autosave e anexos;
- triagem;
- responsável e SLA;
- comentários internos;
- solicitação de complemento;
- conversão em escopo.

### Módulo E — Catálogo, proposta e negociação

- produtos, serviços, pacotes e opcionais;
- custos, margens, impostos e descontos;
- proposta versionada;
- aprovação interna;
- link público;
- eventos de visualização;
- aceite, recusa e alteração;
- PDF;
- expiração;
- assinatura de aceite;
- geração do contrato.

### Módulo F — Contratos

- modelos e cláusulas;
- variáveis;
- versões;
- partes e signatários;
- assinatura e evidências;
- anexos;
- renovação, aditivo, rescisão e vencimento;
- alertas e auditoria.

### Módulo G — Projetos e operações

- criação a partir da proposta aceita;
- escopo e entregáveis;
- fases e marcos;
- tarefas e responsáveis;
- arquivos e versões;
- aprovação do cliente;
- apontamento de horas;
- custos;
- alteração de escopo;
- encerramento e avaliação.

### Módulo H — Financeiro empresarial

- contas financeiras;
- contas a receber e pagar;
- categorias e centros de custo;
- clientes e fornecedores;
- competência e caixa;
- parcelas;
- recorrência;
- transferências;
- baixas parciais;
- juros, multas e descontos;
- conciliação;
- importação CSV/OFX;
- fluxo de caixa;
- DRE gerencial;
- inadimplência;
- lucratividade por projeto, produto e cliente.

### Módulo I — Finanças pessoais

Deve existir em workspace privado **Pessoal**, acessível somente ao proprietário.

- contas, carteiras e investimentos;
- cartões, limites e faturas;
- receitas e despesas;
- transferências;
- parcelamentos;
- categorias e tags;
- orçamento mensal;
- metas e reserva;
- dívidas;
- patrimônio;
- assinaturas e recorrências;
- calendário financeiro;
- CSV/OFX e conciliação;
- relatórios pessoais.

Regra crítica: nenhum usuário empresarial pode consultar, contar, inferir ou exportar dados pessoais.

### Módulo J — Atendimento e sucesso do cliente

- tickets;
- filas;
- prioridade e SLA;
- comentários internos;
- mensagens;
- base de conhecimento;
- satisfação;
- histórico unificado do cliente.

### Módulo K — Documentos e arquivos

- repositório por cliente, oportunidade, contrato e projeto;
- versões;
- permissões;
- links temporários;
- classificação;
- retenção;
- busca;
- histórico de download e alteração.

### Módulo L — Portal do cliente

- propostas;
- contratos;
- projetos;
- entregáveis;
- aprovações;
- arquivos;
- chamados;
- cobranças;
- mensagens e notificações.

### Módulo M — Automação

- gatilhos;
- condições;
- ações;
- templates;
- agendamentos;
- idempotência;
- fila;
- tentativas;
- dead-letter;
- logs;
- ativação e desativação;
- confirmação humana para operações sensíveis.

### Módulo N — Relatórios e gestão

- dashboard por perfil;
- metas;
- funil e conversão;
- forecast;
- produtividade;
- SLA;
- fluxo de caixa;
- DRE;
- lucratividade;
- inadimplência;
- exportação;
- filtros salvos.

### Módulo O — Assistência por IA

Permitido:

- resumo;
- classificação;
- extração;
- sugestão;
- rascunho;
- detecção de duplicidade.

Proibido sem confirmação humana:

- aprovar proposta;
- assinar contrato;
- excluir dados;
- baixar ou alterar transação financeira;
- movimentar dinheiro;
- enviar comunicação externa definitiva.

## 6. Modelo de dados recomendado

Entidades novas prioritárias:

- financial_workspaces;
- financial_accounts;
- financial_categories;
- financial_transactions;
- transaction_splits;
- cost_centers;
- vendors;
- credit_cards;
- credit_card_invoices;
- recurrence_rules;
- budgets;
- budget_lines;
- financial_goals;
- bank_imports;
- reconciliation_matches;
- financial_attachments;
- audit_events;
- pipeline_loss_reasons;
- task_recurrences;
- milestones;
- time_entries;
- support_tickets;
- automation_rules;
- automation_runs;
- client_portal_users.

Regras:

- toda entidade de negócio deve carregar organizationId ou workspaceId;
- chaves estrangeiras e índices devem refletir os filtros de acesso;
- valores monetários usam decimal, nunca float;
- transações financeiras confirmadas não são apagadas: são estornadas;
- eventos públicos usam tokens com validade, escopo e revogação;
- ações críticas geram audit_event;
- timestamps usam timezone;
- migrações são aditivas até a fase de consolidação.

## 7. Roadmap executável

### Fase 0 — Estabilização e ativação

Objetivo: tornar confiáveis os módulos já publicados.

Stories:

- F0-01: onboarding e seed idempotentes;
- F0-02: múltiplos funis;
- F0-03: criação e edição de etapas;
- F0-04: conclusão, reabertura e histórico de tarefas;
- F0-05: restauração de contatos e empresas;
- F0-06: calendário e recorrência de tarefas;
- F0-07: auditoria de autorização multi-organização;
- F0-08: testes E2E dos fluxos existentes;
- F0-09: observabilidade, logs e correlação de erros;
- F0-10: runbook, backup e rollback;
- F0-11: tela de configuração de usuários, papéis e convites;
- F0-12: inventário funcional em produção com status por módulo.

Gate: nenhum erro crítico; fluxos de contatos, empresas, oportunidade e tarefas testados; rollback documentado.

### Fase 1 — Comercial ponta a ponta

- F1-01: cadastro/importação e deduplicação;
- F1-02: qualificação e motivos de perda;
- F1-03: briefing vinculado à oportunidade;
- F1-04: briefing versionado e solicitação de complemento;
- F1-05: escopo gerado do briefing;
- F1-06: proposta com itens, opcionais e descontos;
- F1-07: versão imutável e comparação;
- F1-08: página pública, eventos e expiração;
- F1-09: aceite transacional;
- F1-10: contrato, projeto e recebível gerados no aceite.

Gate: um cliente percorre lead → briefing → proposta → aceite → contrato → projeto → recebível sem intervenção no banco.

### Fase 2 — Operação e entrega

- F2-01: templates de projeto;
- F2-02: marcos e dependências;
- F2-03: responsáveis e calendário;
- F2-04: apontamento de horas;
- F2-05: arquivos versionados;
- F2-06: aprovações e alteração de escopo;
- F2-07: portal do cliente;
- F2-08: encerramento e satisfação.

Gate: projeto completo executado com escopo, prazo, custo, aprovações e aceite final rastreáveis.

### Fase 3 — Financeiro empresarial

- F3-01: workspace financeiro empresarial;
- F3-02: contas financeiras;
- F3-03: categorias, centros de custo e fornecedores;
- F3-04: contas a pagar;
- F3-05: integração dos recebíveis existentes;
- F3-06: transferências e baixas parciais;
- F3-07: recorrência;
- F3-08: importação CSV/OFX;
- F3-09: conciliação;
- F3-10: fluxo de caixa;
- F3-11: DRE;
- F3-12: lucratividade e inadimplência.

Gate: saldo, fluxo e DRE reconciliam com o conjunto de transações de teste.

### Fase 4 — Finanças pessoais

- F4-01: workspace pessoal e políticas privadas;
- F4-02: contas e saldos;
- F4-03: receitas, despesas e transferências;
- F4-04: cartões e faturas;
- F4-05: parcelamentos e recorrências;
- F4-06: orçamento mensal;
- F4-07: metas, dívidas e patrimônio;
- F4-08: importação e conciliação;
- F4-09: calendário e alertas;
- F4-10: relatórios pessoais;
- F4-11: testes negativos de privacidade.

Gate: usuários sem acesso não conseguem consultar nem inferir dados pessoais por UI, action, API, exportação, relatório ou log.

### Fase 5 — Atendimento, automação e inteligência

- F5-01: tickets e SLA;
- F5-02: base de conhecimento;
- F5-03: portal de atendimento;
- F5-04: motor de automações;
- F5-05: fila, retry e dead-letter;
- F5-06: notificações;
- F5-07: dashboards configuráveis;
- F5-08: IA assistida e auditável;
- F5-09: exportações e integrações.

Gate: automações são idempotentes, observáveis e reversíveis; IA nunca executa ação crítica sem confirmação.

## 8. Formato obrigatório de cada story

Cada story criada a partir deste plano deve conter:

- objetivo;
- usuário e valor;
- contexto atual confirmado;
- escopo;
- fora de escopo;
- critérios de aceite verificáveis;
- regras de autorização;
- alterações de banco;
- arquivos prováveis;
- plano de testes;
- telemetria;
- migração;
- rollback;
- feature flag;
- dependências;
- riscos;
- Definition of Done.

A story deve caber preferencialmente em um único ciclo de desenvolvimento e não misturar fundações, UI e vários fluxos independentes.

## 9. Segurança obrigatória

- isolamento por organização/workspace em todas as queries;
- validação server-side;
- RBAC por operação;
- rate limit em endpoints públicos;
- tokens públicos revogáveis e com expiração;
- proteção contra enumeração;
- uploads com tipo, tamanho e malware controlados;
- logs sem senha, token, documento completo ou dados bancários;
- trilha de auditoria para autenticação, permissões, contratos e finanças;
- criptografia em trânsito e backups protegidos;
- princípio de menor privilégio;
- testes IDOR e acesso cruzado;
- rotação dos tokens GitHub/Dokploy anteriormente expostos.

## 10. Estratégia de testes

Em cada story:

1. testes unitários de schemas e regras;
2. testes de action/service;
3. testes de isolamento entre organizações;
4. testes de UI para estados vazio, carregando, sucesso e erro;
5. E2E do fluxo afetado;
6. typecheck;
7. lint dos arquivos alterados;
8. suíte de regressão;
9. build de produção;
10. smoke test após deploy.

Financeiro exige adicionalmente:

- invariantes de débito/crédito;
- precisão decimal;
- idempotência;
- estorno;
- conciliação;
- fechamento;
- concorrência;
- auditoria.

## 11. Padrão de UX

Todos os módulos devem oferecer:

- navegação consistente;
- título, contexto e ação principal claros;
- busca e filtros;
- estado vazio orientativo;
- skeleton ou estado de carregamento;
- mensagens de erro amigáveis com código de suporte;
- confirmação para ação destrutiva;
- feedback de sucesso;
- acessibilidade por teclado;
- responsividade;
- preservação de formulário quando possível;
- datas e moeda em pt-BR;
- ações perigosas diferenciadas visualmente.

## 12. Migração, deploy e rollback

Para cada release:

1. backup verificado;
2. migração aditiva;
3. compatibilidade com versão anterior;
4. feature flag desligada por padrão quando houver risco;
5. deploy;
6. health check;
7. smoke tests;
8. ativação gradual;
9. monitoramento;
10. rollback de aplicação sem perda de dados.

Não remover coluna ou tabela no mesmo release em que seu uso é descontinuado.

## 13. Dívidas técnicas prioritárias

- normalizar finais de linha e fazer o lint global voltar a passar;
- definir BETTER_AUTH_URL e segredo seguro nos ambientes de build;
- migrar middleware para a convenção proxy do Next.js;
- incluir identificação de versão/commit no health endpoint;
- habilitar CI obrigatório;
- adicionar análise automática de segurança;
- documentar variáveis de ambiente;
- eliminar textos corrompidos por encoding;
- padronizar tratamento de erros;
- testar restauração de backup;
- adicionar ambiente de homologação.

## 14. Indicadores de sucesso

- conversão por etapa;
- tempo médio até próxima ação;
- propostas visualizadas e aceitas;
- ciclo médio de venda;
- contratos próximos do vencimento;
- projetos no prazo;
- margem por projeto;
- recebíveis vencidos;
- acurácia do forecast;
- tarefas atrasadas;
- SLA de briefing e atendimento;
- conciliação financeira;
- erros por release;
- tempo de recuperação;
- adoção por módulo.

## 15. Definition of Done global

Uma entrega só está concluída quando:

- critérios de aceite atendidos;
- autorização e isolamento testados;
- migração revisada;
- testes aprovados;
- build aprovado;
- sem segredo no diff;
- estados de UI implementados;
- logs e métricas disponíveis;
- documentação atualizada;
- feature flag definida quando necessária;
- rollback praticável;
- smoke test em produção aprovado;
- story marcada Ready for Review/Done com evidências.

## 16. Ordem imediata recomendada

Executar agora:

1. F0-02 — múltiplos funis;
2. F0-03 — etapas configuráveis;
3. F0-04 — conclusão e histórico de tarefas;
4. F0-05 — restauração de contatos e empresas;
5. F0-07 — auditoria multi-organização;
6. F0-08 — E2E dos módulos atuais;
7. F0-09/F0-10 — observabilidade e runbook;
8. iniciar F1-03/F1-06 para fechar briefing e proposta;
9. somente depois iniciar o razão financeiro empresarial;
10. liberar finanças pessoais após aprovação do isolamento.

## 17. Prompt de handoff para o Claude

> Leia integralmente o arquivo `docs/PLANO_MESTRE_EVOLUCAO_CRM.md`. Faça inventário do estado atual da próxima story e não assuma que uma rota publicada está concluída. Execute somente a primeira story elegível da seção “Ordem imediata recomendada”. Crie ou refine a story com critérios verificáveis, implemente em fatia vertical, aplique isolamento por organização/workspace, escreva testes, execute typecheck/test/build, documente migração e rollback e pare antes de push/deploy caso não haja autorização explícita. Não reescreva módulos estáveis e não misture finanças pessoais com empresariais.

## 18. Fontes internas usadas

- código e rotas atuais do repositório Pulso-CRM;
- plano anterior `docs/CRM_EVOLUTION_MASTER_PLAN.md`;
- stories F0 já iniciadas;
- validações anteriores de login, dashboard, tarefas, build e produção;
- diretriz aprovada de workspace pessoal privado.

## 19. Decisão final

A evolução será incremental, orientada por stories e protegida por gates. O sistema atual será ativado e validado antes da expansão. O financeiro empresarial será construído sobre um razão auditável. As finanças pessoais serão isoladas em workspace privado. Nenhuma fase avançará sem evidência de qualidade, segurança, migração e rollback.

