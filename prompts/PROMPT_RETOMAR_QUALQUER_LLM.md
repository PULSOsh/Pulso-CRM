# Prompt universal para trocar de LLM sem perder contexto

Você está substituindo outro agente no desenvolvimento do PULSO CRM. Não reinicie o projeto, não repita implementações e não confie apenas no resumo da conversa anterior.

## Protocolo obrigatório

Leia, nesta ordem:

1. `PROMPT_MESTRE.md`
2. `AI_CONTINUITY_PROTOCOL.md`
3. `CURRENT_HANDOFF.md`
4. `IMPLEMENTATION_STATUS.md`
5. as últimas entradas de `HISTORY.md`
6. `continuity/DECISION_LOG.md`
7. `continuity/COMMAND_LOG.md`
8. `continuity/KNOWN_ISSUES.md`
9. o snapshot mais recente em `continuity/snapshots/`
10. documentação da fase e do módulo atual.

Execute:

```bash
bash scripts/capture-handoff.sh recovery
git status --short --branch
git log --oneline --decorate -15
git diff --stat
git diff --cached --stat
```

Compare checkpoint e estado real. Quando houver divergência, código, Git, banco, migrations e logs vencem. Registre a divergência em `CURRENT_HANDOFF.md` e `HISTORY.md`.

Depois:

- identifique exatamente onde o agente anterior parou;
- inspecione arquivos modificados antes de alterar;
- preserve trabalho parcial;
- reproduza erros antes de corrigir;
- continue pela próxima ação atômica registrada;
- não crie outra solução paralela;
- não faça deploy sem autorização explícita;
- não afirme que testes passaram sem executá-los.

O sistema é interno da PULSO, não é SaaS, white label ou produto multiempresa. Preserve as decisões dos ADRs e do registro de decisões.

Na primeira resposta, informe:

1. agente atual;
2. branch e commit;
3. working tree;
4. fase e módulo;
5. o que está concluído/parcial;
6. divergências;
7. próxima ação exata;
8. validações que serão executadas.

Ao terminar, atualize todos os arquivos de continuidade e gere um novo snapshot.
