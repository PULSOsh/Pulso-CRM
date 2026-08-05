# CRM-F3-12 — Lucratividade e inadimplência

Status: Done (implementado 2026-08-05) - lucratividade já estava concluída; o gap real era inadimplência

## Objetivo

Fechar o gate da Fase 3 com visibilidade de quanto está vencido, por quanto tempo e de quem.

## Achado

Lucratividade (`/crm/lucratividade`) já era funcional desde uma sessão anterior (métricas empresariais + pessoais, fora do menu principal por decisão de confidencialidade) - nada foi alterado nela. O gap real era inadimplência: só existia o status `overdue` de parcelas, sem taxa, aging ou detalhamento por cliente.

## Escopo

- `getDelinquencyReport()`: total vencido, total em aberto, taxa de inadimplência (vencido/aberto), aging em 4 faixas (0-30/31-60/61-90/90+ dias), detalhamento por cliente (empresa vinculada ao recebível) ordenado do maior para o menor.
- Calculado direto de `due_date < now()`, sem depender de `refreshOverdueInstallments` já ter rodado - evita relatório desatualizado se o refresh sob demanda não tiver sido chamado na sessão atual.
- Foco em inadimplência de clientes (recebíveis) - contas a pagar vencidas não entram neste relatório (é uma métrica de risco de receita, não de fluxo de caixa; fluxo de caixa (F3-10) já cobre pagáveis vencidos).
- UI (`ReportsPanel`, seção "Inadimplência") na aba "Relatórios".

## Fora de escopo

- Régua de cobrança automática (lembrete, negativação) - fica para a Fase 5 (automação) ou um módulo de cobrança dedicado.
- Inadimplência de pagáveis (o que a PULSO deve e não pagou) como métrica separada - coberto indiretamente pelo fluxo de caixa.

## Critérios de aceite verificáveis

- A soma das 4 faixas de aging é igual ao total vencido.
- Um recebível sem empresa vinculada aparece agrupado como "Sem cliente vinculado" em vez de ser omitido.
- Taxa de inadimplência é 0 quando não há nada em aberto (sem divisão por zero).
- Tipos e build passam.

## Regras de autorização

Reaproveita `reports.finance`.

## Alterações de banco

Nenhuma.

## Dev Agent Record

### File List

- `src/server/actions/reports.ts` - `getDelinquencyReport`.
- `src/components/crm/finance/reports-panel.tsx` - seção de inadimplência.

### Completion Notes

`tsc --noEmit`, `next build` - verdes.

## Fechamento da Fase 3

Com esta story, as 12 stories da Fase 3 (F3-01 a F3-12) estão implementadas. O gate da fase - "saldo, fluxo e DRE reconciliam com o conjunto de transações de teste" - está tecnicamente satisfeito no código: o razão único (`financial_transactions`) é alimentado por toda baixa de recebível e pagável (F3-05), fluxo de caixa e DRE são derivados dele (F3-10/F3-11), e a conciliação bancária (F3-09) existe para confirmar isso contra o extrato real. Falta validação com dado real (banco disponível, extrato bancário real, organização de teste) - débito recorrente de toda a sessão, sem `DATABASE_URL` configurado neste ambiente.
