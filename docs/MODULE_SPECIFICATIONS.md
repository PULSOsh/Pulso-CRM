# Especificações dos módulos

## 1. Workspace, usuários e permissões

O sistema possui um único workspace: PULSO.

Recursos:

- usuários internos;
- convite controlado;
- ativação e desativação;
- papéis;
- permissões por módulo;
- revogação de sessão;
- auditoria de alterações.

Não criar seletor de organização nem onboarding multiempresa.

---

## 2. Contatos e empresas

### Contato

- nome;
- e-mail;
- telefone;
- WhatsApp;
- cargo;
- documento opcional;
- Instagram;
- origem;
- canal preferido;
- observações;
- responsável;
- tags;
- consentimentos;
- status;
- empresas vinculadas;
- contato principal.

### Empresa

- nome fantasia;
- razão social;
- documento;
- segmento;
- e-mail;
- telefone;
- WhatsApp;
- site;
- Instagram;
- endereço;
- observações;
- responsável;
- tags;
- status;
- contatos.

### Regras

- entidades separadas;
- vínculo muitos-para-muitos;
- normalização de e-mail e telefone;
- alerta de duplicidade;
- busca sem acento;
- soft delete;
- restauração;
- paginação;
- exportação protegida;
- visão 360°.

Mesclas ambíguas nunca automáticas.

---

## 3. Briefings

### Jornada pública

```text
Abrir link
→ responder etapas
→ anexar
→ revisar
→ consentir
→ enviar
→ receber protocolo
```

### Estados

```text
started
→ submitted
→ under_review
→ qualified
→ linked
→ proposal_created
→ archived

submitted → spam
```

### Recursos

- uso sem login;
- progresso;
- validação no servidor;
- autosave;
- retomada;
- anexos;
- revisão;
- consentimento;
- confirmação;
- protocolo;
- antispam;
- idempotência;
- responsividade;
- acessibilidade.

### Caixa interna

Filtros por status, produto, data, origem, responsável, completude, cidade, duplicidade e vínculo.

Ações:

- criar ou vincular contato;
- criar ou vincular empresa;
- criar oportunidade;
- atribuir responsável;
- qualificar;
- marcar spam;
- arquivar;
- criar tarefa;
- registrar nota;
- iniciar proposta.

---

## 4. CRM, funis e oportunidades

### Funil inicial

```text
Novo contato — 10%
Qualificação — 20%
Diagnóstico — 35%
Proposta enviada — 55%
Negociação — 75%
Fechado — 100%
Perdido — 0%
```

### Oportunidade

- título;
- empresa;
- contato;
- responsável;
- funil;
- etapa;
- produtos;
- origem;
- temperatura;
- descrição;
- diagnóstico;
- orçamento informado;
- valor estimado;
- valor negociado;
- probabilidade;
- previsão;
- próxima ação;
- tags;
- arquivos;
- status;
- motivo de perda;
- briefing;
- proposta;
- contrato;
- projeto.

### Kanban

- dnd-kit;
- posição persistida;
- transação;
- atualização otimista;
- rollback;
- concorrência;
- histórico;
- auditoria;
- autorização;
- alternativa por teclado;
- filtros;
- busca;
- totais;
- visão em lista;
- mobile.

### Card

Mostrar apenas informação acionável:

- empresa ou cliente;
- avatar ou iniciais;
- produto;
- temperatura;
- valor;
- responsável;
- próxima ação;
- data;
- atraso;
- tags essenciais.

### Ganho

Confirmar valor, data e condição comercial. Preparar contrato, recebível, parcelas, projeto e tarefas iniciais.

### Perda

Motivo obrigatório, observação opcional, data, responsável, histórico e auditoria. Reabertura exige permissão e justificativa.

---

## 5. Atividades, tarefas e calendário

### Atividades

- nota;
- ligação;
- WhatsApp;
- e-mail;
- reunião;
- mudança de etapa;
- tarefa;
- proposta;
- contrato;
- pagamento;
- arquivo;
- aprovação;
- evento de sistema.

Linha do tempo unificada, mantendo tabelas próprias para eventos críticos.

### Tarefa

- título;
- descrição;
- responsável;
- criador;
- prioridade;
- status;
- prazo;
- lembrete;
- checklist;
- recorrência futura;
- entidade vinculada.

### Visões

- minhas tarefas;
- hoje;
- atrasadas;
- próximas;
- concluídas;
- por responsável;
- por projeto;
- por oportunidade;
- calendário.

Conclusão registra autor e horário. Reabertura é auditada.

---

## 6. Produtos e serviços

Campos:

- nome;
- slug;
- categoria;
- descrição;
- preço inicial;
- unidade;
- prazo;
- escopo;
- inclusões;
- exclusões;
- condições;
- adicionais;
- dependências;
- custo estimado;
- custo externo;
- horas estimadas;
- margem mínima;
- limite de desconto;
- template de briefing;
- template de proposta;
- template de contrato;
- checklist de projeto;
- status.

Os 15 produtos existentes devem ser preservados e auditados, não recriados sem necessidade.

---

## 7. Propostas

### Estados e ações

Separar claramente:

- salvar rascunho;
- revisar;
- publicar;
- copiar link;
- enviar;
- criar nova versão;
- revogar;
- expirar.

### Versionamento

- rascunho muda livremente;
- publicação cria snapshot;
- snapshot é imutável;
- alteração relevante cria nova versão;
- versões anteriores permanecem;
- apenas uma versão fica ativa para aceite;
- versão aceita não é substituída;
- token pode ser revogado;
- validade pode expirar;
- link público só existe depois de publicar.

### Página pública

Mostrar marca, cliente, versão, validade, escopo, investimento, pagamentos, adicionais, arquivos públicos, aceite, alteração, recusa, WhatsApp e privacidade.

Não mostrar notas internas, custos, margem, respostas sensíveis, dados bancários completos ou IDs internos.

### Eventos

```text
proposal.draft_created
proposal.version_created
proposal.published
proposal.sent
proposal.viewed
proposal.pdf_downloaded
proposal.whatsapp_clicked
proposal.addon_selected
proposal.changes_requested
proposal.rejected
proposal.accepted
proposal.expired
proposal.revoked
```

### Aceite

Registrar nome, e-mail, relação com empresa, declaração, data, hora, IP, user agent, versão, hash, condição comercial, adicionais e consentimentos.

Aceite comercial não deve ser apresentado automaticamente como assinatura jurídica completa.

### Solicitação de alteração

Não altera proposta automaticamente. Registra mensagem, cria atividade, notificação e tarefa. Nova condição exige nova publicação.

---

## 8. Contratos

### Origem

Derivado da proposta aceita, sem recadastro.

### Estados

```text
draft → sent → signed → ended
draft/sent → cancelled
```

### Regras

- revisão antes do envio;
- envio congela versão;
- mudança cria versão;
- contrato assinado não edita;
- cancelamento exige motivo;
- PDF final;
- checksum;
- evidências;
- anexo externo permitido;
- assinatura externa apenas por adapter futuro;
- dados da PULSO vêm de configuração, nunca hardcoded.

---

## 9. Projetos

### Criação

Ao converter venda, herdar cliente, contato, oportunidade, briefing, proposta, contrato, produtos, valor, prazo, arquivos, observações, pagamentos, checklist e tarefas iniciais.

### Etapas iniciais

```text
Aguardando pagamento
Aguardando materiais
Planejamento
Design
Desenvolvimento
Revisão interna
Aprovação do cliente
Publicação
Entregue
```

### Estados

```text
planned → active → paused → active → completed
planned/active/paused → cancelled
```

### Campos

- nome;
- descrição;
- responsável;
- equipe;
- etapa;
- status;
- valor;
- custo previsto;
- início;
- prazo;
- progresso;
- URLs;
- checklist;
- tarefas;
- arquivos;
- aprovações;
- revisões;
- histórico;
- garantia;
- manutenção.

### Encerramento

Registrar data, checklist final, links, documentação, handoff, credenciais entregues com segurança, início da garantia, manutenção e possível recorrência.

---

## 10. Arquivos

- S3 compatível;
- privado por padrão;
- chave imprevisível;
- prefixo do workspace;
- MIME e extensão permitidos;
- limite de tamanho;
- nome original;
- autor;
- data;
- checksum;
- URL temporária;
- exclusão lógica;
- retenção;
- limpeza de órfãos;
- auditoria.

Entidades vinculáveis: contato, empresa, oportunidade, briefing, proposta, contrato, projeto, aprovação, recebível, parcela e despesa.

Contrato assinado e comprovante possuem regras restritivas de exclusão e acesso.

---

## 11. Aprovações

### Estados

```text
pending
approved
approved_with_notes
rejected
expired
cancelled
```

### Página pública

- descrição;
- versão;
- arquivos;
- preview;
- prazo;
- aprovar;
- aprovar com observação;
- solicitar ajuste;
- comentar.

### Evidências

Token, versão, decisão, comentário, data, IP, user agent, contato e hash quando aplicável.

Rejeição cria tarefa. Nova versão exige nova aprovação.

---

## 12. Financeiro operacional

Não substitui contabilidade, emissão fiscal, folha ou escrituração.

### Contas de recebimento

Nome, instituição, tipo, tipo de PIX, chave protegida, padrão e ativa.

### Recebível

Cliente, oportunidade, proposta, contrato, projeto, descrição, total, status, competência e conta.

### Parcela

Número, valor, vencimento, status, data de pagamento, valor pago, método, conta, comprovante e observação.

### Estados

```text
pending
due_soon
paid
overdue
cancelled
```

### Regras

- parcelas somam o total;
- entrada pode ser parcela;
- baixa registra usuário, data e valor;
- baixa parcial explícita;
- estorno exige permissão;
- parcela paga não apaga;
- comprovante privado;
- atraso atualizado por job;
- dinheiro nunca usa float;
- alterações auditadas;
- conversão idempotente.

---

## 13. Custos, lucro e sustentabilidade

Módulo confidencial.

### Separação

- despesas pessoais;
- despesas empresariais;
- custos diretos de projeto;
- investimentos;
- pró-labore;
- retirada;
- distribuição;
- reembolso;
- aporte;
- despesa pessoal paga pela empresa.

### Privacidade

Comercial e projetos não veem despesas pessoais. Financeiro pode ver empresa sem ver pessoal. Owner controla compartilhamento.

### Indicadores

- custo fixo empresarial;
- necessidade pessoal;
- custo total de sustentação;
- receita contratada;
- receita recebida;
- custos variáveis;
- margem de contribuição;
- resultado operacional;
- resultado disponível;
- ponto de equilíbrio;
- meta mínima;
- meta segura;
- meta de crescimento;
- runway empresarial;
- runway pessoal;
- rentabilidade por projeto;
- rentabilidade por produto;
- valor-hora mínimo;
- meta proporcional.

Todas as fórmulas devem ser testadas e documentadas.

---

## 14. Dashboard e relatórios

O dashboard responde: **o que exige minha atenção hoje?**

### Atenção

- lead sem contato;
- oportunidade sem próxima ação;
- ação vencida;
- proposta sem follow-up;
- contrato aguardando retorno;
- tarefa atrasada;
- projeto parado;
- aprovação pendente;
- parcela vencida;
- despesa próxima;
- meta proporcional.

### Relatórios comerciais

Leads, conversão, origem, produto, perda, ticket, ciclo, responsável e previsão.

### Relatórios operacionais

Projetos, atrasos, tarefas, aprovações, revisões e prazos.

### Relatórios financeiros

Recebido, previsto, vencido, recorrência, inadimplência, margem, despesas e rentabilidade.

Regras: agregações no banco, filtros por URL, timezone consistente, exportação autorizada, gráficos acessíveis, tabela equivalente e nenhum cálculo completo no cliente.
