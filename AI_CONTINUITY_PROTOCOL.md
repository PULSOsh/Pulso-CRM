# PULSO CRM — Protocolo de continuidade entre LLMs

**Versão:** 1.0  
**Aplicação:** Claude → Codex → Gemini 3.1 (ou outro agente autorizado)  
**Objetivo:** trocar de LLM sem perder contexto, repetir trabalho, sobrescrever mudanças ou inventar o estado do projeto.

## Princípio central

A memória de uma conversa nunca é a fonte de verdade do projeto.

A continuidade depende de cinco camadas versionadas no próprio repositório:

1. **Produto:** `docs/` e `modules/` descrevem o que deve existir.
2. **Estado real:** código, banco, migrations, Git, logs e ambiente descrevem o que existe.
3. **Checkpoint atual:** `CURRENT_HANDOFF.md` descreve onde a última sessão parou.
4. **Histórico permanente:** `HISTORY.md` registra o que aconteceu sem apagar entradas anteriores.
5. **Decisões:** `continuity/DECISION_LOG.md` registra decisões que não podem ser redescobertas por tentativa.

## Ordem preferencial de agentes

```text
Claude
→ se indisponível ou sem créditos: Codex
→ se indisponível ou sem créditos: Gemini 3.1
→ se necessário: qualquer outra LLM capaz de trabalhar no repositório
```

A ordem não altera requisitos, arquitetura ou critérios de aceite. Nenhum agente pode reinterpretar o produto por preferência própria.

## Arquivos obrigatórios para toda sessão

Antes de escrever código, o agente deve ler:

1. `PROMPT_MESTRE.md`
2. `AI_CONTINUITY_PROTOCOL.md`
3. `CURRENT_HANDOFF.md`
4. `IMPLEMENTATION_STATUS.md`
5. últimas entradas de `HISTORY.md`
6. `continuity/DECISION_LOG.md`
7. documentação da fase e do módulo atual
8. código e testes diretamente relacionados

## Regra de entrada

O agente que entra deve confirmar o checkpoint pelo estado real. Deve executar, quando disponíveis e seguros:

```bash
git status --short --branch
git log --oneline --decorate -15
git diff --stat
git diff --cached --stat
```

Depois deve verificar:

- branch e commit atuais;
- arquivos modificados e não rastreados;
- migrations locais e aplicadas;
- comandos realmente executados;
- último resultado conhecido de lint, typecheck, testes e build;
- bloqueios e próxima ação exata.

Se o checkpoint divergir do repositório, o repositório vence e a divergência deve ser registrada.

## Regra de saída

Antes de encerrar uma sessão relevante, trocar de modelo ou consumir os créditos disponíveis, o agente deve:

1. deixar o working tree compreensível;
2. não apagar trabalho parcial;
3. atualizar `CURRENT_HANDOFF.md`;
4. acrescentar uma entrada em `HISTORY.md`;
5. atualizar `IMPLEMENTATION_STATUS.md` se o estado de um módulo mudou;
6. registrar decisões em `continuity/DECISION_LOG.md`;
7. registrar comandos e resultados reais em `continuity/COMMAND_LOG.md`;
8. informar riscos, arquivos tocados e próxima ação atômica;
9. executar `scripts/capture-handoff.sh`, quando possível;
10. nunca declarar testes aprovados sem executá-los.

## Se os créditos acabarem sem handoff

O agente seguinte não deve recomeçar do zero nem confiar na última mensagem da conversa. Deve usar o protocolo de recuperação:

1. executar `scripts/capture-handoff.sh recovery`;
2. ler Git, diffs, arquivos não rastreados e commits recentes;
3. comparar com `IMPLEMENTATION_STATUS.md`;
4. localizar a fase atual no `STEP_BY_STEP_IMPLEMENTATION.md`;
5. inspecionar testes próximos aos arquivos modificados;
6. executar primeiro verificações somente leitura;
7. atualizar `CURRENT_HANDOFF.md` com o estado reconstruído;
8. só então continuar.

## Proibições

- Não começar novamente um módulo sem verificar o que já existe.
- Não descartar mudanças não commitadas para “limpar” o projeto.
- Não usar `git reset --hard`, `git clean -fd`, rebase destrutivo ou force push sem autorização explícita.
- Não criar migrations concorrentes sem comparar o banco e o journal do Drizzle.
- Não fazer deploy porque outro agente “aparentemente concluiu”.
- Não copiar segredos, credenciais, dumps ou dados pessoais para documentos de handoff.
- Não transformar suposição em histórico.

## Critério de handoff válido

Um handoff é válido quando outro agente consegue responder, apenas lendo o repositório:

- qual problema está sendo resolvido;
- qual fase está ativa;
- o que foi concluído;
- o que está parcial;
- quais arquivos mudaram;
- quais migrations existem;
- quais comandos passaram ou falharam;
- quais decisões foram tomadas;
- quais riscos permanecem;
- qual é a próxima ação exata.
