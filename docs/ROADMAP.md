# Roadmap de implementação

## Regra de ordem

A ordem é baseada em dependências, risco e utilidade real. Não avançar para uma fase quando os critérios de saída da anterior não estiverem atendidos.

---

## Fase 0 — Auditoria, segurança e estabilização

### Objetivo

Compreender e estabilizar a base antes de expandir.

### Entregas

- Git e working tree auditados;
- checks executados;
- migrations reconciliadas;
- segredos removidos;
- senha administrativa rotacionada;
- Dokploy revisado;
- mocks e rotas duplicadas mapeados;
- design system diagnosticado;
- `IMPLEMENTATION_STATUS.md` atualizado;
- baseline de testes registrado.

### Gate

Nenhum dado perdido, nenhum segredo fixo e estado real documentado.

---

## Fase 1 — Workspace interno, usuários, RBAC e auditoria

### Entregas

- único workspace PULSO;
- usuários internos;
- papéis;
- permissões tipadas;
- helper de autorização;
- autorização server-side;
- testes de acesso;
- auditoria de membros e papéis.

### Gate

Alterar URL ou payload não contorna permissão.

---

## Fase 2 — Design system, shell e limpeza de rotas

### Entregas

- Tailwind tokens funcionando;
- componentes UI reutilizados;
- shell responsivo e acessível;
- links mortos removidos ou ocultos;
- rotas mockadas isoladas, redirecionadas ou removidas;
- identidade única.

### Gate

Build verde, navegação coerente e ausência de telas falsas no menu principal.

---

## Fase 3 — CRM operacional

### Entregas

- contatos e empresas robustos;
- normalização e duplicidade;
- oportunidades completas;
- Kanban persistente;
- histórico;
- atividades;
- tarefas;
- calendário;
- ganho e perda.

### Gate

Lead → oportunidade → próxima ação → tarefa → ganho/perda funciona com persistência e histórico.

---

## Fase 4 — Briefings

### Entregas

- portal público validado;
- autosave e retomada;
- anexos;
- protocolo;
- caixa interna;
- qualificação;
- conversão sem recadastro;
- antispam e idempotência.

### Gate

Briefing público gera oportunidade real sem duplicação indevida.

---

## Fase 5 — Propostas

### Entregas

- editor real;
- cálculo;
- rascunho;
- publicação;
- snapshots;
- versões;
- página pública;
- eventos;
- aceite;
- alteração;
- recusa;
- PDF;
- envio.

### Gate

Nenhum link público é mostrado antes da publicação. Versão aceita permanece imutável.

---

## Fase 6 — Contratos

### Entregas

- contrato derivado da proposta;
- templates;
- versão;
- envio;
- página pública;
- assinatura/registro;
- evidências;
- PDF final;
- redesign conforme tokens.

### Gate

Contrato assinado não pode ser alterado e preserva snapshot verificável.

---

## Fase 7 — Projetos, arquivos e aprovações

### Entregas

- conversão da venda;
- projeto;
- etapas;
- equipe;
- checklists;
- tarefas;
- arquivos privados;
- aprovações públicas;
- entrega;
- garantia;
- manutenção.

### Gate

Venda aceita vira execução acompanhável até entrega e aprovação.

---

## Fase 8 — Financeiro operacional

### Entregas

- contas;
- recebíveis;
- parcelas;
- vencimentos;
- baixas;
- baixa parcial;
- estorno;
- comprovantes;
- jobs de atraso;
- indicadores.

### Gate

Condição comercial gera recebíveis idempotentes e pagamentos preservam histórico.

---

## Fase 9 — Custos, lucro e sustentabilidade

### Entregas

- despesas empresariais;
- custos de projeto;
- investimentos;
- dados pessoais restritos;
- pró-labore;
- retiradas;
- margem;
- metas;
- runway;
- rentabilidade;
- painéis exclusivos.

### Gate

Gustavo consegue responder quanto custa operar, quanto precisa faturar, quanto pode retirar e quais projetos dão margem.

---

## Fase 10 — Dashboard, relatórios, notificações e busca

### Entregas

- painel de atenção;
- relatórios comerciais;
- relatórios operacionais;
- relatórios financeiros;
- relatórios de sustentabilidade;
- busca global;
- notificações internas;
- exportações autorizadas.

### Gate

Indicadores batem com os dados transacionais e possuem alternativa tabular acessível.

---

## Fase 11 — Produção endurecida

### Entregas

- testes unitários;
- integração;
- componentes;
- E2E;
- acessibilidade;
- observabilidade;
- backup;
- restauração testada;
- rollback;
- deploy reproduzível;
- runbooks.

### Gate

Checks e E2E críticos verdes, restauração comprovada e sem segredos no código.

---

## Fase 12 — Integrações e IA assistida

Só depois da operação interna estar estável.

### Permitido

- SMTP;
- storage;
- WhatsApp por link;
- webhooks internos necessários;
- calendário externo futuro;
- resumos;
- sugestões;
- rascunhos;
- classificação assistida.

### Proibido

- IA autônoma;
- ação crítica sem confirmação;
- automação complexa sem uso real;
- abstração para SaaS;
- envio desnecessário de dados confidenciais.
