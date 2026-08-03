# Plano mestre de evolução do PULSO CRM

Status: PLAN_READY  
Responsável: Pulso / Produto e Engenharia  
Validade da decisão: 90 dias

## Objetivo

Transformar o CRM atual em um sistema operacional completo para a Pulso, cobrindo aquisição, diagnóstico, proposta, aceite, contrato, execução, cobrança, lucratividade e gestão financeira pessoal do proprietário.

## Princípios obrigatórios

- Preservar os módulos atuais e evoluir por fatias testáveis.
- Separar integralmente dados pessoais e empresariais por workspace e permissões.
- Toda movimentação financeira deve possuir histórico, conciliação e auditoria.
- Briefing, proposta, contrato, projeto e cobrança devem manter rastreabilidade ponta a ponta.
- Nenhuma automação pode apagar ou alterar dados financeiros sem confirmação e registro.
- Cada fase precisa passar por tipos, testes, build, segurança, migração e rollback antes do deploy.

## Estado atual confirmado

Já existem rotas, ações e tabelas para:

- usuários, organizações, papéis e permissões;
- contatos, empresas, funis e oportunidades;
- atividades, tarefas e notificações;
- produtos e serviços;
- briefings públicos, templates e caixa de entrada;
- propostas, versões, links públicos, aceite e aprovação;
- contratos, assinatura e cancelamento;
- projetos, arquivos e aprovações;
- recebíveis, parcelas, custos e lucratividade;
- dashboard e relatórios.

Pendências explícitas encontradas:

- criação de novos funis;
- validações ponta a ponta ainda não confirmadas em pipeline, tarefas, contatos e empresas;
- recorrência e calendário;
- rastreamento de conclusão de tarefas;
- restauração de contatos e empresas excluídos;
- endurecimento de migrações, observabilidade e tratamento de erros;
- ausência de um domínio financeiro pessoal separado.

## Arquitetura funcional alvo

### 1. Comercial

Lead → qualificação → oportunidade → diagnóstico → briefing → proposta → negociação → ganho/perda.

Entregas:

- múltiplos funis configuráveis;
- etapas, probabilidades, motivos de perda e metas;
- atividades, tarefas recorrentes, agenda e lembretes;
- histórico completo e busca global;
- automações de próxima ação e follow-up.

### 2. Briefings

Solicitação → formulário público → triagem → complemento → aprovação interna → vínculo com oportunidade/projeto.

Entregas:

- construtor de templates, seções, perguntas e lógica condicional;
- autosave, anexos, consentimento e proteção contra duplicidade;
- versionamento de respostas;
- conversão em escopo e itens de proposta;
- status, responsável, SLA e comentários internos.

### 3. Propostas e orçamentos

Oportunidade/briefing → composição → revisão → envio → visualização → negociação → aceite.

Entregas:

- catálogo de itens, escopo, opcionais, descontos, impostos e condições;
- versões imutáveis e comparação entre versões;
- página pública responsiva;
- eventos de abertura, aceite, recusa e solicitação de alteração;
- geração de contrato e recebível após aceite;
- PDF e trilha de evidências.

### 4. Contratos, projetos e entrega

Proposta aceita → contrato → assinatura → projeto → marcos → aprovações → encerramento.

Entregas:

- modelos de contrato e variáveis;
- assinatura com evidências;
- projetos gerados a partir do escopo aprovado;
- marcos, tarefas, arquivos, aprovações e portal do cliente;
- controle de alterações de escopo;
- encerramento com aceite e avaliação.

### 5. Financeiro empresarial

Entregas:

- contas financeiras, categorias, centros de custo e fornecedores;
- contas a receber e a pagar;
- parcelas, recorrências, juros, multas, descontos e baixas parciais;
- conciliação manual e importação CSV/OFX;
- fluxo de caixa realizado e projetado;
- DRE gerencial, lucratividade por projeto/produto/cliente;
- anexos, comprovantes e auditoria;
- alertas de vencimento e inadimplência.

### 6. Finanças pessoais

Implementar como workspace `Pessoal`, visível somente ao proprietário, sem mistura de saldos, categorias, relatórios ou permissões da empresa.

Entregas:

- contas, cartões, faturas, limites e vencimentos;
- receitas, despesas, transferências e parcelamentos;
- categorias, tags, orçamento mensal e metas;
- despesas recorrentes e assinaturas;
- patrimônio, dívidas e evolução do saldo;
- importação CSV/OFX e conciliação;
- calendário financeiro e alertas;
- visão consolidada opcional exibindo apenas totais autorizados.

### 7. Gestão e inteligência

- dashboard configurável por perfil;
- metas comerciais e financeiras;
- relatórios exportáveis;
- notificações no sistema e e-mail;
- auditoria administrativa;
- IA assistida apenas para resumo, classificação e sugestão, nunca para decisão financeira automática.

## Modelo de dados novo — núcleo financeiro

- `financial_workspaces`: empresa ou pessoal, proprietário e políticas de acesso.
- `financial_accounts`: banco, caixa, carteira, investimento ou cartão.
- `financial_categories`: árvore de receitas e despesas por workspace.
- `financial_transactions`: receita, despesa, transferência, competência e caixa.
- `transaction_splits`: rateio por categoria, projeto e centro de custo.
- `credit_cards` e `credit_card_invoices`.
- `recurrence_rules`: recorrências com próxima ocorrência e limite.
- `budgets` e `budget_lines`.
- `financial_goals`: reserva, compra, quitação ou investimento.
- `bank_imports` e `reconciliation_matches`.
- `financial_attachments` e eventos de auditoria.

As tabelas atuais de recebíveis e parcelas permanecem inicialmente; uma camada de serviço sincroniza os eventos para o novo razão financeiro sem migração destrutiva.

## Sequência de execução

### Fase 0 — Estabilização e fechamento do que está aberto

- corrigir seed inicial e onboarding de workspace;
- finalizar novos funis, calendário, recorrência e restauração;
- testes E2E de contatos, empresas, pipeline e tarefas;
- observabilidade, páginas amigáveis de erro e runbook de produção.

Aceite: fluxos atuais passam em testes automatizados e manuais sem erro crítico.

### Fase 1 — Fluxo comercial completo

- lead até oportunidade;
- briefing vinculado à oportunidade;
- proposta versionada e pública;
- aceite gerando contrato, projeto e recebível.

Aceite: um cliente percorre o fluxo completo sem intervenção no banco.

### Fase 2 — Financeiro empresarial completo

- contas a pagar, contas financeiras, categorias e conciliação;
- fluxo de caixa e DRE;
- integração com projetos, propostas e recebíveis existentes.

Aceite: saldos e relatórios reconciliam com as transações de teste.

### Fase 3 — Finanças pessoais

- workspace privado;
- cartões, orçamento, recorrência, patrimônio e metas;
- importação e conciliação.

Aceite: usuário sem permissão não consegue consultar nem inferir nenhum dado pessoal.

### Fase 4 — Portal, automações e inteligência

- portal do cliente;
- aprovações, arquivos e mensagens;
- alertas e automações;
- IA assistida com logs e confirmação humana.

Aceite: automações são idempotentes, auditáveis e reversíveis.

## Riscos e mitigação

- Mistura de dados pessoais e empresariais: isolamento por workspace, políticas de acesso e testes negativos.
- Divergência financeira: razão imutável, conciliação e eventos idempotentes.
- Migração quebrar produção: migrações aditivas, backup, shadow test e rollback.
- Escopo excessivo: entregas verticais por fase, sem reescrever módulos estáveis.
- Dados sensíveis: criptografia, logs sem segredos, menor privilégio e auditoria.

## Fora de escopo inicial

- integração bancária automática via Open Finance;
- contabilidade fiscal oficial e emissão de notas;
- recomendações de investimento;
- movimentação automática de dinheiro;
- aplicativo móvel nativo.

Esses itens só entram após o núcleo financeiro estar reconciliado e aprovado.

## Próximo handoff

Produto detalha a Fase 0 em histórias pequenas. Arquitetura valida o modelo multi-workspace. UX desenha os fluxos financeiro empresarial e pessoal. Desenvolvimento implementa uma fatia por vez. Segurança e QA aprovam cada release. DevOps promove somente builds aprovados.

Condição de reversão: cada fase deve poder ser desativada por feature flag sem remover ou corromper dados existentes.
