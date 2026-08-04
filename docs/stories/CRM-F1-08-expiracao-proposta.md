# CRM-F1-08 — Página pública, eventos e expiração

Status: Done (implementado 2026-08-04)

## Objetivo

Fazer `validUntil` ter efeito real: proposta vencida para de poder ser aceita e a página pública informa isso claramente.

## Achado (antes de implementar)

- Página pública e mecanismo de token/eventos já existiam e funcionam (`getPublicProposal`/`approveProposal`, seções anteriores desta sessão e de sessões passadas).
- `proposals.validUntil` existe e é editável no construtor/editor de proposta desde a Fase 3 de uma sessão anterior, mas **nada verificava** — uma proposta vencida continuava aceitável indefinidamente.
- `proposal_events` (tabela dedicada a eventos) existe no schema desde a fundação, mas **nunca foi usada em nenhum lugar do código** — o projeto já resolve "eventos" via `activities`/`logActivity` (criação, publicação, primeira visualização, nova versão, aceite — todos já logados ali desde a Fase 2 de sessão anterior). Decisão desta story: **não** passar a escrever também em `proposal_events` — isso duplicaria um mecanismo que já funciona, criando duas fontes de verdade pro mesmo tipo de evento. `proposal_events` fica como tabela não usada, mesma situação de antes, registrada como decisão, não como pendência esquecida.

## Escopo

- `getPublicProposal`: se `validUntil` já passou e o status ainda está pendente (draft/sent/viewed), transiciona pra `expired` na própria leitura (mesmo padrão já usado por "primeira visualização" nesta função).
- `approveProposal`: revalida a expiração no momento do aceite (defesa em profundidade — uma aba aberta antes do vencimento não deve conseguir aceitar depois).
- Página pública mostra "Esta proposta expirou..." em vez do texto genérico de status quando `status === "expired"`.

## Fora de escopo

- Job agendado que expira propostas em lote (a transição acontece sob demanda, na leitura/tentativa de aceite — mesmo padrão de `refreshOverdueInstallments`/`getOverdueTasks`, sem scheduler ainda neste projeto).
- Popular `proposal_events` — decisão deliberada, ver "Achado" acima.

## Critérios de aceite verificáveis

- Acessar a página pública de uma proposta com `validUntil` no passado e status ainda pendente transiciona o status pra `expired` e mostra a mensagem de expiração, sem o formulário de aceite.
- Tentar aceitar uma proposta vencida (mesmo que a página não tenha recarregado) é rejeitado pelo servidor.
- Proposta sem `validUntil` continua aceitável normalmente (nada muda).
- Tipos, testes e build passam.

## Regras de autorização

Sem mudança — `getPublicProposal`/`approveProposal` continuam públicas por token.

## Alterações de banco

Nenhuma — `expired` já era um valor válido de `proposalStatusEnum`.

## Dev Agent Record

### File List

- `src/server/actions/public-quote.ts` — expiração em `getPublicProposal` e revalidação em `approveProposal`.
- `src/app/proposta/[token]/page.tsx` — mensagem de expiração.

### Completion Notes

- `tsc --noEmit`: limpo. `vitest run`: 106/106 (inalterado). `next build`: verde, 32 rotas. `biome lint`: 0 erros.
- **Não validado com dado real**: mesma limitação de toda a sessão.