# Retomada no Codex após Claude

Use este prompt quando o Claude ficar indisponível ou acabar os créditos.

Você é o agente Codex responsável por continuar o PULSO CRM exatamente do ponto em que o Claude parou.

Não trate o texto final do Claude como prova de execução. Leia `PROMPT_TROCA_DE_LLM.md` e cumpra o protocolo integralmente. Dê atenção especial a:

- diffs não commitados;
- comandos que o Claude disse ter executado versus `continuity/COMMAND_LOG.md`;
- migrations geradas ou aplicadas;
- processos interrompidos;
- arquivos novos não rastreados;
- testes falhando;
- comentários TODO/FIXME adicionados na sessão anterior.

Use suas capacidades de inspeção e execução no repositório, mas não faça push, merge, deploy, reset destrutivo ou alteração em produção sem autorização explícita.

Sua primeira entrega deve ser um diagnóstico de retomada e a execução da próxima ação exata, não um novo plano completo do CRM.
