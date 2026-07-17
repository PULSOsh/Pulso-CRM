# CLAUDE.md — Instruções obrigatórias do PULSO CRM

## 1. Autoridade destes arquivos

Estas instruções prevalecem sobre documentos antigos que mencionem SaaS, white label, multiempresa comercial, billing, planos ou venda futura do CRM.

O PULSO CRM é um sistema interno e exclusivo da PULSO.

Leia antes de alterar qualquer código:

- `IMPLEMENTATION_STATUS.md`
- `docs/PRODUCT_VISION.md`
- `docs/SCOPE_AND_NON_GOALS.md`
- `docs/ARCHITECTURE_AND_STANDARDS.md`
- `docs/MODULE_SPECIFICATIONS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ROADMAP.md`
- `docs/QUALITY_AND_ACCEPTANCE.md`
- `docs/adr/`
- `docs/runbooks/`

## 2. Missão

Transformar o repositório atual em um sistema confiável que a PULSO utilize diariamente para trabalhar, vender, executar, receber e decidir.

Fluxo principal:

```text
Origem do lead
→ briefing ou cadastro manual
→ contato e empresa
→ oportunidade
→ qualificação
→ diagnóstico
→ proposta
→ negociação
→ aceite
→ contrato
→ recebível
→ projeto
→ tarefas e arquivos
→ aprovação
→ publicação ou entrega
→ garantia
→ manutenção
→ possível nova oportunidade
```

## 3. Decisão de produto

O CRM é:

- interno;
- single-workspace;
- adaptado à operação da PULSO;
- acessado apenas por usuários autorizados;
- desenvolvido conforme problemas reais da empresa;
- uma fonte única de verdade.

O CRM não é:

- SaaS;
- white label;
- plataforma multiempresa para terceiros;
- produto para revenda;
- ERP genérico;
- substituto de contabilidade;
- ferramenta de IA autônoma.

## 4. Single-workspace e `organization_id`

O banco já possui estrutura associada a organização. Não faça uma refatoração destrutiva para remover `organization_id` neste momento.

Trate a única organização como o **workspace interno da PULSO**.

Regras:

- manter exatamente uma organização operacional;
- não criar seletor de organização;
- não criar onboarding de organização;
- não criar convites entre empresas;
- não criar planos, limites ou billing;
- não criar branding por organização;
- não investir em generalização multiempresa;
- continuar filtrando dados pelo workspace interno no servidor;
- preservar a possibilidade de papéis internos por usuário.

## 5. Princípios obrigatórios

### Problema antes da tecnologia

Toda feature deve responder:

- qual problema real resolve;
- quem usa;
- qual ação fica mais simples;
- qual dado deve permanecer confiável;
- como será validada em uso real.

### Produto acima de feature

Não construir páginas desconectadas. Concluir fluxos de ponta a ponta.

### Próxima ação obrigatória

Oportunidade aberta sem próxima ação é um lead abandonado.

Destacar:

- lead sem primeiro contato;
- oportunidade sem próxima ação;
- próxima ação vencida;
- proposta sem follow-up;
- contrato sem retorno;
- projeto sem tarefa futura;
- aprovação pendente;
- parcela vencida.

### Simples por fora, sólido por dentro

A interface deve ser clara e rápida. Regras ficam em schemas, services, repositories, autorização, transações, histórico e auditoria.

### Histórico confiável

Não sobrescrever silenciosamente eventos críticos.

- proposta publicada gera snapshot imutável;
- contrato enviado preserva versão;
- contrato assinado não edita;
- parcela paga não apaga;
- mudança de etapa registra histórico;
- alteração de preço registra evento;
- desconto fora da regra exige autorização;
- reabertura de venda exige justificativa;
- correção financeira cria ajuste ou estorno.

## 6. Protocolo de trabalho

Antes de alterar:

```bash
git status
git diff
git diff --staged
git log --oneline --decorate -20
```

Depois, executar os comandos reais disponíveis no projeto para:

- lint;
- typecheck;
- testes;
- build.

Nunca afirme que um comando passou sem executá-lo.

Trabalhe em mudanças pequenas, testáveis e reversíveis.

Para cada fase:

1. auditar;
2. registrar diagnóstico;
3. planejar;
4. implementar banco e migração;
5. implementar validação;
6. implementar repository;
7. implementar service;
8. implementar autorização;
9. implementar interface;
10. implementar auditoria;
11. implementar testes;
12. executar checks;
13. atualizar documentação;
14. criar commit coeso;
15. registrar próxima ação exata.

## 7. Proibições

Não:

- fazer deploy sem autorização explícita;
- apagar working tree não compreendido;
- alterar produção sem backup;
- recriar migrations já aplicadas;
- colocar senha ou token no código;
- usar mock como resultado final;
- declarar módulo concluído apenas por possuir uma tela;
- usar Tailwind cru como sistema visual paralelo;
- criar abstrações SaaS;
- instalar pacote sem verificar compatibilidade;
- trocar stack por conveniência;
- executar SQL em componentes ou páginas;
- confiar em `organization_id` enviado pelo cliente;
- depender de ocultar botão como autorização;
- enviar dados pessoais ou financeiros para IA sem necessidade explícita.

## 8. Quando pedir decisão ao responsável

Pergunte apenas diante de:

- risco real de perda de dados;
- mudança irreversível;
- custo externo;
- credencial inexistente;
- contradição material sem resolução nos arquivos;
- decisão jurídica, contábil ou financeira oficial.

Não pergunte novamente o que já está especificado.

## 9. Formato de relatório ao concluir uma fase

```text
FASE CONCLUÍDA:
Objetivo:
Diagnóstico encontrado:
Arquivos alterados:
Schemas alterados:
Migrations criadas:
Migrations aplicadas:
Regras implementadas:
Permissões implementadas:
Testes criados:
Comandos executados:
Resultado do lint:
Resultado do typecheck:
Resultado dos testes:
Resultado do build:
Validação manual:
Impacto em produção:
Riscos restantes:
Débitos conhecidos:
IMPLEMENTATION_STATUS atualizado:
Commit criado:
Próxima ação exata:
```

## 10. Regra final

Uma tela bonita não é um módulo concluído.

> Construir. Usar. Corrigir. Aprender. Evoluir.
