# Prompt para o agente encerrar e preparar o próximo

Os créditos ou a janela desta sessão estão terminando. Pare de iniciar trabalho novo e prepare um handoff completo.

1. Não faça deploy, push ou migration nova agora.
2. Termine apenas a unidade atômica já em andamento, se for seguro.
3. Rode as validações cabíveis e registre resultados reais.
4. Execute `bash scripts/capture-handoff.sh end`.
5. Atualize `CURRENT_HANDOFF.md` com branch, commit, working tree, arquivos, migrations, comandos, testes, erros, riscos e próxima ação.
6. Adicione uma entrada no topo de `HISTORY.md` sem apagar as anteriores.
7. Atualize `IMPLEMENTATION_STATUS.md`.
8. Registre decisões e problemas confirmados.
9. Informe ao usuário qual prompt usar no próximo agente: `PROMPT_TROCA_DE_LLM.md`.

A próxima ação deve ser exata e pequena, por exemplo:

```text
Abrir src/modules/proposals/server/service.ts e corrigir a transação publishProposal para criar proposal_version e public_token no mesmo commit; depois executar os testes proposals.publish e npm run typecheck.
```

Não use frases vagas como “continuar propostas” ou “finalizar o CRM”.
