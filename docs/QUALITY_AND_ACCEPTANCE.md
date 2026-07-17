# Qualidade, testes e critérios de aceite

## 1. Definition of Done

Uma funcionalidade só está concluída quando possui:

```text
banco e migration
+ schema
+ validação de servidor
+ repository
+ service
+ autorização server-side
+ filtro pelo workspace interno
+ histórico
+ auditoria quando crítica
+ loading
+ estado vazio
+ erro
+ sucesso
+ acesso negado
+ mobile
+ teclado
+ acessibilidade
+ teste
+ documentação
+ ausência de mock final
+ ausência de segredo
+ lint aprovado
+ typecheck aprovado
+ testes aprovados
+ build aprovado
```

## 2. Critérios globais

- persistência real;
- nenhuma regra crítica somente no cliente;
- nenhuma ação crítica somente por esconder botão;
- nenhum dado cruzado por usuário sem permissão;
- nenhum link público antes do estado correto;
- nenhum registro imutável sobrescrito;
- dinheiro com `numeric`;
- horário consistente;
- erros compreensíveis;
- operações idempotentes quando repetição for possível;
- migrations reversíveis ou com plano de recuperação;
- auditoria sem segredos.

## 3. Pirâmide de testes

### Unitários

- cálculos financeiros;
- fórmulas de margem e metas;
- normalização;
- validadores;
- máquinas de estado;
- permissões puras;
- geração de parcelas;
- idempotência.

### Integração

- repositories;
- services;
- transações;
- autorização;
- filtros do workspace;
- histórico;
- auditoria;
- migrations importantes.

### Componentes

- formulários;
- mensagens de erro;
- estados de loading e vazio;
- diálogos;
- Kanban por teclado;
- tabelas;
- componentes do design system.

### E2E

Fluxos críticos reais.

## 4. E2E principal

```text
Login
→ empresa
→ contato
→ oportunidade
→ tarefa
→ proposta
→ publicação
→ visualização pública
→ alteração
→ nova versão
→ aceite
→ contrato
→ assinatura
→ recebível
→ parcelas
→ projeto
→ tarefa de projeto
→ arquivo
→ aprovação
→ entrega
→ pagamento
→ margem
→ relatório
```

## 5. E2E de briefing

```text
Briefing público
→ autosave
→ retomada
→ envio
→ protocolo
→ caixa interna
→ qualificação
→ contato
→ empresa
→ oportunidade
→ proposta
```

## 6. Casos negativos obrigatórios

- acesso sem sessão;
- papel insuficiente;
- tentativa de enviar workspace diferente;
- usuário desativado;
- token público inválido;
- token expirado;
- token revogado;
- proposta ainda em rascunho;
- reenvio de aceite;
- contrato já assinado;
- parcela já paga;
- estorno sem permissão;
- upload inválido;
- arquivo privado acessado por link indevido;
- operação repetida;
- falha parcial em transação;
- conflito de edição;
- migration incompatível.

## 7. Critérios por módulo

### CRM

- posição persiste;
- histórico registra movimento;
- próxima ação é visível;
- ganho e perda são transacionais;
- perda exige motivo;
- reabertura é auditada.

### Proposta

- rascunho sem link público;
- publicação cria snapshot;
- versão anterior permanece;
- aceite registra evidências;
- alteração não modifica versão automaticamente.

### Contrato

- deriva da proposta;
- envio congela versão;
- assinatura preserva evidência;
- assinado não edita.

### Projeto

- deriva da venda;
- mantém vínculos;
- rejeição de aprovação cria tarefa;
- entrega registra handoff e garantia.

### Financeiro

- parcelas somam total;
- baixa registra autor e horário;
- baixa parcial funciona;
- paga não apaga;
- estorno é separado;
- comprovante é privado.

### Lucratividade

- fórmulas possuem testes com casos conhecidos;
- projeção é marcada como projeção;
- dados pessoais ficam restritos;
- custo congelado no projeto quando necessário.

## 8. Comando de qualidade esperado

O projeto deve possuir ou alcançar equivalente a:

```json
{
  "lint": "biome check .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "build": "next build",
  "check": "npm run lint && npm run typecheck && npm run test && npm run build"
}
```

Adaptar ao package manager e scripts reais sem fingir resultados.
