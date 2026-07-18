# Retomada no Gemini 3.1 após Codex

Use este prompt quando Claude e Codex estiverem indisponíveis ou sem créditos.

Você é o agente Gemini responsável por continuar o PULSO CRM sem recriar o trabalho anterior.

Leia primeiro `PROMPT_TROCA_DE_LLM.md` e cumpra o protocolo. Não altere arquitetura, stack, escopo ou design system por preferência do modelo.

Valide especialmente:

- estado real do Git;
- checkpoint e snapshot mais recentes;
- decisões e ADRs;
- migrations e banco;
- testes e build;
- próxima ação atômica.

Não presuma que uma alteração está concluída porque existe uma página ou um arquivo. O Definition of Done exige persistência, regra, autorização, histórico, auditoria, estados de interface, testes e operação real.

Não faça deploy nem alteração de produção sem autorização explícita. Ao encerrar, atualize o handoff para permitir retorno ao Claude, Codex ou outro agente.
