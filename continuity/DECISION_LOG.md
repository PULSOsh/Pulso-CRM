# Registro de decisões de execução

> Registre aqui decisões que afetam mais de uma sessão. Decisões arquiteturais formais também devem receber ADR em `docs/adr/`.

| Data | ID | Decisão | Motivo | Impacto | Agente |
|---|---|---|---|---|---|
| 2026-07-18 | DEC-001 | O PULSO CRM é interno e exclusivo da PULSO. | Decisão definitiva do proprietário. | Não construir SaaS, billing, white label, onboarding público ou troca de workspace. | ChatGPT |
| 2026-07-18 | DEC-002 | Preservar `organization_id` como fronteira técnica existente, sem transformar o CRM em produto multiempresa. | Evitar refatoração destrutiva e manter autorização consistente. | Uma organização operacional: PULSO. | ChatGPT |
| 2026-07-18 | DEC-003 | Propostas publicadas usam snapshots imutáveis. | Preservar evidência e impedir alteração retroativa. | Editar após publicação cria nova versão. | ChatGPT |
| 2026-07-18 | DEC-004 | A continuidade entre LLMs é baseada no repositório, não na memória da conversa. | Evitar repetição e perda de contexto. | Checkpoint, histórico e snapshot obrigatórios. | ChatGPT |
| 2026-07-18 | DEC-005 | Instalar só a camada de protocolo do pacote `PULSO_CRM_CONTINUIDADE_TOTAL` (continuity/scripts/prompts/checklists), não a de documentação de produto. | O pacote estava desatualizado frente ao repositório real; instalar `docs/*`/`modules/*` em bloco duplicaria/contradiria documentação já mais completa e auditada. | Protocolo de handoff formal disponível sem regressão de conteúdo. | Claude |
| 2026-07-18 | DEC-006 | Autorização geral do responsável ("construa tudo, não pare") cobre decisões de implementação, mas não substitui autorização explícita e específica para push/deploy nem para aplicação de migration em banco real. | Push aciona deploy automático em produção; migration altera dado real — ambos são ações de blast radius diferente de escrever/commitar código, e o próprio `CLAUDE.md`/`AI_CONTINUITY_PROTOCOL.md` deste repositório exige autorização explícita para as duas, sem exceção documentada. | 9 commits desta sessão ficaram locais; migrations `0003` e `0004` geradas mas não aplicadas. | Claude |
| 2026-07-18 | DEC-007 | O gate de confidencialidade da Fase 8 (`STEP_BY_STEP_IMPLEMENTATION.md`: "não iniciar sem confirmação explícita do responsável, dado o nível de confidencialidade") foi tratado como satisfeito pela autorização geral já dada pelo responsável nesta sessão, por ser o próprio fundador/único stakeholder autorizando. | O gate existe pra proteger dado financeiro pessoal do fundador de ser exposto/mal implementado, não pra impedir o próprio fundador de autorizar o trabalho. | Módulo de Custos/Lucratividade implementado com RBAC real (`profitability.read_personal` exclusivo de `owner`) — a confidencialidade foi cumprida via autorização técnica, não pulada. | Claude |

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
