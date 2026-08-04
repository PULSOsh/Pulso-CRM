# CRM-F1-06 — Proposta com itens opcionais

Status: Done (implementado 2026-08-04)

## Objetivo

Permitir marcar itens de uma proposta como opcionais — o cliente decide incluí-los ou não no momento do aceite, com o valor final refletindo a escolha.

## Achado (antes de implementar)

`proposal_selected_addons` já existia no schema desde a migration `0000` (produção), pronta pra registrar quais opcionais foram oferecidos/escolhidos em cada aceite — nunca usada. Mais grave: `proposalSelectedAddons.responseId` referencia `proposal_responses`, uma tabela **também nunca usada** — `approveProposal` tinha um comentário explícito admitindo isso ("we'd ideally insert into proposalResponses here... For the MVP..."). A UI pública já promete evidência formal ("Aceite registra nome, e-mail, data e IP como evidência") que **não era gravada em lugar nenhum**. Implementar opcionais de verdade exigiu implementar `proposalResponses` como pré-requisito — o que também fecha esse débito antigo já registrado em sessões anteriores.

## Escopo

- `proposalItems.isOptional` (novo, default `false`).
- `computeTotals` (quotes.ts) passa a somar só itens obrigatórios no subtotal/total "de cabeçalho" — opcionais não inflam o valor garantido antes do aceite.
- `approveProposal(token, signerData, selectedOptionalItemIds)`: agora grava `proposalResponses` de verdade (nome, e-mail, hash do snapshot, IP, user-agent — via `headers()`) e `proposalSelectedAddons` para cada item opcional da versão (selecionado ou não, com valor congelado).
- UI: checkbox "Opcional" por item em `quote-builder-form.tsx`/`quote-content-form.tsx`; página pública mostra "(opcional)" nos itens; modal de aceite (`approve-modal.tsx`) lista os opcionais com checkbox e total dinâmico antes de confirmar.

## Fora de escopo

- Relatório/exibição interna de quais opcionais foram aceitos historicamente — o dado agora existe (`proposal_selected_addons`), mas nenhuma tela consulta isso ainda.
- Múltiplas opções de pagamento reagindo ao total com opcionais (o plano de pagamento continua fixo, calculado sobre o total base).

## Critérios de aceite verificáveis

- Marcar um item como opcional na criação/edição da proposta persiste a flag.
- O subtotal/total "de cabeçalho" da proposta não inclui itens opcionais.
- Na página pública, selecionar opcionais atualiza o total exibido no modal de aceite antes de confirmar.
- Confirmar o aceite grava uma linha em `proposal_responses` (nome, e-mail, hash, IP, user-agent) e uma linha em `proposal_selected_addons` por item opcional da versão, com `selected` refletindo a escolha real.
- Tipos, testes e build passam.

## Regras de autorização

Sem mudança — `approveProposal` continua público por token (já validava `publicAccessEnabled` + status).

## Alterações de banco

- Nova coluna `proposal_items.is_optional`. Migration aditiva gerada (`0009_heavy_dark_beast.sql`), **não aplicada**.

## Riscos

- `proposals.total`/`subtotal` (o valor "publicado") não é atualizado após o aceite mesmo que opcionais tenham sido incluídos — decisão deliberada (não sobrescrever silenciosamente um valor histórico, princípio de `CLAUDE.md` "histórico confiável"). O valor efetivamente aceito é reconstituível a partir de `proposal_items`/`proposal_selected_addons` por uma tela futura, não duplicado num campo novo.

## Dev Agent Record

### File List

- `src/server/db/schema/proposals.ts` — +`isOptional`.
- `src/server/db/migrations/0009_heavy_dark_beast.sql` — gerada, não aplicada.
- `src/server/actions/quotes.ts` — `QuoteItemInput.isOptional`; `computeTotals` ignora opcionais; 3 pontos de insert de `proposalItems` gravam a flag.
- `src/server/actions/public-quote.ts` — `getPublicProposal` expõe `isOptional`; `approveProposal` grava `proposalResponses`/`proposalSelectedAddons`.
- `src/app/proposta/[token]/page.tsx` + `approve-modal.tsx` — checkboxes de opcionais e total dinâmico.
- `src/app/crm/quotes/new/quote-builder-form.tsx`, `src/components/crm/quotes/quote-content-form.tsx`, `src/app/crm/quotes/[id]/page.tsx` — checkbox "Opcional" por item.

### Completion Notes

- `tsc --noEmit`: limpo. `vitest run`: 106/106 (inalterado). `next build`: verde, 32 rotas (sem rota nova). `biome lint`: 0 erros.
- **Não validado com dado real**: mesma limitação de toda a sessão — não foi possível confirmar um aceite real com opcionais selecionados contra um banco de verdade.