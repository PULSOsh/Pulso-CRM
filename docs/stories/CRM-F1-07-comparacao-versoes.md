# CRM-F1-07 — Versão imutável e comparação

Status: Done (implementado 2026-08-04)

## Objetivo

Confirmar a imutabilidade de versões (já existia) e construir a "comparação" que faltava: ver duas versões de uma proposta lado a lado.

## Achado (antes de implementar)

`createNewProposalVersion` já cria uma linha nova em `proposal_versions` a cada alteração relevante numa proposta publicada, preservando a anterior intacta (`CRM-F1-02`/Fase 2 de sessões anteriores) — imutabilidade já resolvida. Faltava só a comparação: a tela de detalhe mostrava apenas a contagem ("• N versões"), sem nenhuma forma de ver o conteúdo de uma versão anterior.

## Escopo

- `getProposalVersionDetail(proposalId, versionId)`: retorna título/escopo/itens/total de uma versão específica, validado contra a organização.
- `VersionCompareModal`: dois seletores (versão A/B, padrão nas duas mais recentes), busca e mostra lado a lado — sem diff algorítmico (destacar campo a campo é um upgrade futuro; ver lado a lado já entrega o valor pedido).
- Link "Comparar versões" na tela de detalhe, visível quando há mais de uma versão.

## Fora de escopo

- Diff visual campo a campo (destacar o que mudou em vermelho/verde) — versão lado a lado simples entrega a comparação pedida sem esse trabalho extra.

## Critérios de aceite verificáveis

- Com 2+ versões, o link "Comparar versões" aparece e abre o modal.
- Trocar a versão em qualquer um dos dois seletores busca e exibe o conteúdo correspondente.
- `getProposalVersionDetail` rejeita uma versão que não pertence à proposta/organização informada.
- Tipos, testes e build passam.

## Regras de autorização

`proposals.read` (mesma chave da tela de detalhe).

## Alterações de banco

Nenhuma.

## Dev Agent Record

### File List

- `src/server/actions/quotes.ts` — +`getProposalVersionDetail`.
- `src/components/crm/quotes/version-compare-modal.tsx` — novo.
- `src/components/crm/quotes/quote-detail-client.tsx` — link + modal.

### Completion Notes

- `tsc --noEmit`: limpo. `vitest run`: 106/106 (inalterado). `next build`: verde, 32 rotas. `biome lint`: 0 erros (corrigido um `useExhaustiveDependencies` real refatorando o fetch pro `useEffect` reagir a `leftId`/`rightId`/`proposalId` em vez de chamadas manuais duplicadas no `onChange`).
- **Não validado com dado real**: mesma limitação de toda a sessão.