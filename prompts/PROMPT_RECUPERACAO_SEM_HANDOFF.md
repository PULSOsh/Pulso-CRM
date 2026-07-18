# Recuperação de emergência sem handoff

A sessão anterior terminou sem atualizar os arquivos de continuidade.

Reconstrua o estado exclusivamente com evidências:

1. rode `bash scripts/capture-handoff.sh recovery`;
2. leia Git status, diffs completos, arquivos não rastreados e commits recentes;
3. verifique package scripts e processos ainda ativos;
4. compare migrations locais com o journal do Drizzle e o banco, sem aplicar nada;
5. procure logs e resultados de testes existentes;
6. leia `IMPLEMENTATION_STATUS.md`, mas trate-o como potencialmente desatualizado;
7. identifique o módulo pelos arquivos modificados;
8. execute verificações não destrutivas;
9. atualize `CURRENT_HANDOFF.md` com o estado reconstruído;
10. registre no `HISTORY.md` que houve recuperação sem handoff.

Não descarte mudanças, não crie migration nova, não faça deploy e não rode correções automáticas amplas antes de compreender o estado.
