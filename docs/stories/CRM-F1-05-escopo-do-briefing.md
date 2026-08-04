# CRM-F1-05 — Escopo gerado do briefing

Status: Done (implementado 2026-08-04)

## Objetivo

Preencher o campo "Escopo" do construtor de orçamento automaticamente a partir das respostas do briefing vinculado à oportunidade selecionada, evitando redigitar manualmente o que o lead já respondeu.

## Contexto confirmado

- `quote-builder-form.tsx` já tinha uma opção "Usar briefing" como origem de dados, mas **desabilitada** ("Em breve") desde a validação de design da Fase 2 (sessão anterior) — a decisão registrada foi não implementar uma origem separada, porque `createQuote` exige `opportunityId` (não há proposta sem oportunidade no modelo atual).
- Em vez de reabrir essa decisão de escopo maior, esta story entrega o valor real pedido ("escopo gerado do briefing") dentro do fluxo já existente: com uma oportunidade selecionada, se ela tiver um briefing vinculado (`briefingSubmissions.opportunityId`, já usado por `CRM-F1-03`), um botão gera o texto do escopo a partir das respostas.

## Escopo

- `getBriefingSummaryForOpportunity(opportunityId)`: formata as respostas (`metadata.answers`) da submissão de briefing mais recente vinculada à oportunidade num texto "Rótulo: valor" por linha. Retorna `null` se não houver briefing vinculado.
- Botão "Gerar do briefing" ao lado do campo Escopo em `quote-builder-form.tsx` — preenche o textarea, mostra o protocolo de origem ou um aviso se não houver briefing.

## Fora de escopo

- Reabrir "Usar briefing"/"Preencher manualmente" como origens de dados separadas — decisão já tomada em sessão anterior, não revisitada aqui.
- Geração de itens/produtos a partir do briefing — só o texto do escopo.

## Critérios de aceite verificáveis

- Selecionar uma oportunidade com briefing vinculado e clicar "Gerar do briefing" preenche o escopo com as respostas formatadas.
- Selecionar uma oportunidade sem briefing vinculado mostra um aviso claro, sem erro.
- Tipos, testes e build passam.

## Regras de autorização

`opportunities.read` (mesma chave de leitura de oportunidades).

## Alterações de banco

Nenhuma.

## Riscos

Nenhum — ação client-triggered, só formata texto, não persiste nada até o usuário salvar o rascunho normalmente.

## Dev Agent Record

### File List

- `src/server/actions/briefing-submissions.ts` — +`getBriefingSummaryForOpportunity`.
- `src/app/crm/quotes/new/quote-builder-form.tsx` — botão "Gerar do briefing".

### Completion Notes

- `tsc --noEmit`: limpo. `vitest run`: 106/106 (inalterado — sem schema novo). `next build`: verde, 32 rotas. `biome lint`: 0 erros.
- **Não validado com dado real**: mesma limitação de toda a sessão.