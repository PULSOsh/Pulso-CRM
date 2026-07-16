# PULSO CRM — Requisitos do produto V2

## 1. Objetivo

Construir um sistema operacional completo para acompanhar o relacionamento da PULSO com clientes desde a captação até a entrega e a recorrência.

A jornada central é:

```text
briefing público
→ triagem no CRM
→ contato, empresa e oportunidade
→ orçamento em formato de site
→ resposta do cliente
→ contrato, projeto, recebíveis e manutenção
```

Também deve ser possível criar um orçamento totalmente manual, usando dados digitados pelo usuário interno.

## 2. Princípios obrigatórios

- Multiempresa desde o banco, mesmo que inicialmente exista apenas a organização PULSO.
- Todo dado de negócio deve possuir `organization_id` e isolamento no backend.
- Permissão deve ser verificada no servidor, não apenas escondida na interface.
- Briefings e propostas publicados devem conservar versões imutáveis.
- Valores financeiros são calculados no servidor em centavos inteiros.
- Links públicos usam tokens aleatórios, revogáveis, com validade e rate limit.
- Eventos relevantes são auditáveis e idempotentes.
- Nenhum dado interno ou sensível pode aparecer em páginas públicas.

## 3. Perfis

- **Administrador:** configura organização, usuários, produtos, preços, templates e integrações.
- **Comercial:** gerencia briefings, contatos, empresas, oportunidades e propostas.
- **Projetos:** acessa clientes fechados, projetos, tarefas, materiais e aprovações.
- **Financeiro:** gerencia contratos, parcelas, recebimentos e relatórios financeiros.
- **Visualizador:** consulta registros autorizados sem alterações críticas.

## 4. Área pública

### 4.1 Briefing

- URL por template e versão publicada.
- Formulário em etapas, responsivo e acessível.
- Salvamento seguro para retomada.
- Perguntas condicionais.
- Upload de anexos com validação.
- Consentimento e aviso de privacidade.
- Protocolo ao concluir.
- Antispam, rate limit e idempotência.

### 4.2 Proposta em site

- URL pública por token.
- Conteúdo editorial responsivo.
- Escopo, entregáveis, cronograma, investimento, condições e validade.
- Opções de pagamento e adicionais selecionáveis.
- Registro de visualização sem expor rastreamento invasivo.
- Ações: aceitar, pedir alteração, recusar e baixar PDF.
- Aceite com identidade declarada, confirmação e snapshot do conteúdo aceito.
- Link expirado ou revogado não exibe a proposta.

## 5. Área interna

### 5.1 Caixa de briefings

- Estados: iniciado, enviado, em análise, qualificado, vinculado, proposta criada e arquivado/spam.
- Busca e filtros.
- Detecção assistida de possíveis contatos e empresas duplicados.
- Visualização das respostas e anexos.
- Criação ou vínculo de contato, empresa e oportunidade.
- Notas internas, prioridade e responsável.
- Geração de proposta diretamente da submissão.

### 5.2 CRM e Kanban

- Funis e etapas configuráveis.
- Cards arrastáveis com ordem persistente.
- Contato, empresa, produto, valor, origem, responsável, temperatura e próxima ação.
- Histórico de movimentação.
- Filtros, busca e visão por responsável.
- Motivos estruturados de perda.

### 5.3 Gerador de orçamento

Origens possíveis:

- briefing público;
- oportunidade do CRM;
- catálogo/produtos;
- cópia de proposta anterior;
- dados digitados manualmente;
- sugestão assistida por IA, sempre sujeita à revisão humana.

O editor deve permitir:

- escolher template;
- definir cliente e contexto;
- montar problema, objetivo, solução, escopo e entregáveis;
- selecionar produtos, itens, quantidades, descontos e adicionais;
- definir cronograma, validade, garantia e condições;
- configurar uma ou mais formas de pagamento;
- visualizar preview em tempo real;
- salvar rascunho, criar versão, publicar, revogar e duplicar;
- gerar PDF a partir do mesmo snapshot publicado.

### 5.4 Respostas e continuidade

Ao aceitar uma proposta:

- bloquear o snapshot aceito;
- registrar hash, identidade, data, IP truncado quando permitido e user agent reduzido;
- atualizar oportunidade;
- criar atividades e notificações;
- permitir criação de contrato, projeto e recebíveis sem redigitação.

Pedidos de alteração devem gerar uma solicitação vinculada sem modificar a versão publicada. Recusa deve registrar motivo e atualizar o CRM conforme regra configurada.

## 6. Módulos posteriores

- Produtos e precificação.
- Contratos e assinatura/aceite.
- Projetos, tarefas, arquivos, checklists e aprovações.
- Financeiro operacional, parcelas, recebimentos e MRR.
- Dashboard e relatórios.
- Automações, webhooks, e-mail, armazenamento e PDF.
- IA assistida com logs, limites, redaction e aprovação humana.

## 7. Critérios globais de aceite

- Área interna exige autenticação.
- Organização A nunca acessa dados da organização B.
- Formulários públicos funcionam por teclado e apresentam erros associados aos campos.
- Reenvio não cria duplicidade.
- Proposta publicada é imutável; alterações criam nova versão.
- Totais são recalculados no servidor.
- Aceite é vinculado à versão e ao snapshot correto.
- Logs não armazenam segredos, tokens integrais ou conteúdo sensível desnecessário.
- Testes cobrem cálculo, autorização, condicionais, idempotência e fluxos públicos críticos.
- Build, migrações, restauração e deploy possuem procedimento documentado.
