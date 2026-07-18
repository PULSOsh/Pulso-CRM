# Protocolo prático de handoff

## Saída planejada

1. Pare em um ponto seguro e compreensível.
2. Não esconda erro com comentário, cast ou feature falsa.
3. Execute as validações cabíveis.
4. Rode `bash scripts/capture-handoff.sh end`.
5. Atualize `CURRENT_HANDOFF.md`.
6. Acrescente entrada em `HISTORY.md`.
7. Atualize `IMPLEMENTATION_STATUS.md`.
8. Registre decisões e problemas.
9. Entregue ao usuário o prompt `PROMPT_TROCA_DE_LLM.md`.

## Entrada planejada

1. Leia `PROMPT_RETOMAR_QUALQUER_LLM.md`.
2. Rode `bash scripts/capture-handoff.sh start`.
3. Compare snapshot, checkpoint e Git.
4. Leia documentação da fase atual.
5. Inspecione arquivos modificados antes de editá-los.
6. Reproduza falhas com logs reais.
7. Continue pela próxima ação atômica.

## Recuperação sem saída planejada

1. Não suponha que a última ação terminou.
2. Rode `bash scripts/capture-handoff.sh recovery`.
3. Verifique processos, locks, migrations e arquivos temporários.
4. Leia diffs completos.
5. Execute somente verificações não destrutivas.
6. Reconstrua o checkpoint.
7. Continue apenas quando o estado estiver compreendido.

## Handoff durante uma migration

Se uma sessão parar durante trabalho de banco:

- não aplique outra migration;
- verifique journal do Drizzle e tabela de migrations;
- compare schema real com SQL local;
- confirme backup;
- registre se a migration foi gerada, aplicada, parcialmente aplicada ou revertida;
- nunca adivinhe pelo nome do arquivo.
