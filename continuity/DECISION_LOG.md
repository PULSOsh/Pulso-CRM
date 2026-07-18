# Registro de decisões de execução

> Registre aqui decisões que afetam mais de uma sessão. Decisões arquiteturais formais também devem receber ADR em `docs/adr/`.

| Data | ID | Decisão | Motivo | Impacto | Agente |
|---|---|---|---|---|---|
| 2026-07-18 | DEC-001 | O PULSO CRM é interno e exclusivo da PULSO. | Decisão definitiva do proprietário. | Não construir SaaS, billing, white label, onboarding público ou troca de workspace. | ChatGPT |
| 2026-07-18 | DEC-002 | Preservar `organization_id` como fronteira técnica existente, sem transformar o CRM em produto multiempresa. | Evitar refatoração destrutiva e manter autorização consistente. | Uma organização operacional: PULSO. | ChatGPT |
| 2026-07-18 | DEC-003 | Propostas publicadas usam snapshots imutáveis. | Preservar evidência e impedir alteração retroativa. | Editar após publicação cria nova versão. | ChatGPT |
| 2026-07-18 | DEC-004 | A continuidade entre LLMs é baseada no repositório, não na memória da conversa. | Evitar repetição e perda de contexto. | Checkpoint, histórico e snapshot obrigatórios. | ChatGPT |

## Template

```text
Data:
ID: DEC-NNN
Contexto:
Decisão:
Alternativas rejeitadas:
Motivo:
Impacto em banco/API/UI/testes/deploy:
Reversível? Como?
ADR relacionado:
Agente:
```
