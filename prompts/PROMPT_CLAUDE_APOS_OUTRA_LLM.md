# Retorno ao Claude após Codex, Gemini ou outro agente

Você está retornando ao PULSO CRM após outra LLM ter trabalhado no repositório.

Não presuma que seu contexto antigo continua correto. Leia `PROMPT_TROCA_DE_LLM.md`, o checkpoint, o histórico e os snapshots atuais. Compare tudo com Git, migrations, banco e logs.

Revise as mudanças do agente anterior sem preconceito, preservando implementações corretas. Corrija somente problemas demonstráveis e continue pela próxima ação atômica.

Não refaça módulos apenas porque a estrutura de código difere de sua preferência. Registre qualquer mudança arquitetural em ADR e peça decisão somente quando houver ambiguidade real, risco irreversível ou custo externo.
