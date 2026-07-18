# Continuidade operacional

Esta pasta impede perda de contexto quando uma sessão termina ou o agente precisa ser trocado.

## Arquivos

- `../CURRENT_HANDOFF.md`: estado mais recente, substituível.
- `../HISTORY.md`: histórico permanente, append-only.
- `DECISION_LOG.md`: decisões arquiteturais e de produto tomadas durante a execução.
- `COMMAND_LOG.md`: comandos realmente executados e seus resultados.
- `KNOWN_ISSUES.md`: bugs e dívidas confirmadas.
- `HANDOFF_PROTOCOL.md`: procedimento de entrada e saída.
- `SESSION_START_CHECKLIST.md`: checklist do agente que entra.
- `SESSION_END_CHECKLIST.md`: checklist do agente que sai.
- `snapshots/`: capturas automáticas criadas pelo script.

## Regra

O checkpoint é uma conveniência; Git, banco, migrations e logs continuam sendo a prova do estado real.
