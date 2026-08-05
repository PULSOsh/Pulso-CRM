# CRM-F3-02 — Contas financeiras

Status: Done (implementado 2026-08-05)

## Objetivo

Permitir cadastrar e gerenciar contas financeiras (bancárias, caixa) reais, para que pagamentos e recebimentos possam ser vinculados a uma conta específica.

## Achado

A tabela `financial_accounts` existe desde a migration `0000` (produção), mas nunca teve nenhuma action, service ou tela - zero uso real até esta story.

## Escopo

- `createFinancialAccount`/`updateFinancialAccount`/`deactivateFinancialAccount`/`getFinancialAccounts`.
- Uma única conta padrão por organização (`isDefault`) - marcar uma nova como padrão desmarca a anterior, na mesma transação.
- UI (`AccountsPanel`) na aba "Contas e transferências" de `/crm/financeiro`.

## Fora de escopo

- Saldo armazenado na própria conta (o saldo é sempre derivado do razão - `financial_transactions`, F3-05/F3-10 - nunca um campo que pode dessincronizar).
- Integração bancária automática (Open Finance) - fica para quando houver necessidade real.

## Critérios de aceite verificáveis

- Criar uma conta com `isDefault: true` desmarca a conta padrão anterior.
- Desativar uma conta remove o destaque de padrão.
- Tipos, testes e build passam.

## Regras de autorização

`financial_accounts.read`/`financial_accounts.manage` (novas chaves, dadas ao papel `finance`; `admin`/`owner` recebem automaticamente por já herdarem todas as chaves).

## Alterações de banco

Nenhuma - reaproveita a tabela `financial_accounts` já existente desde `0000`.

## Dev Agent Record

### File List

- `src/server/actions/financial-accounts.ts` + `.schemas.ts` + `.schemas.test.ts` - novos.
- `src/server/auth/permission-keys.ts` - `financial_accounts.read`/`financial_accounts.manage`.
- `src/components/crm/finance/accounts-panel.tsx` - novo.
- `src/app/crm/financeiro/page.tsx` - integra a aba.

### Completion Notes

`tsc --noEmit`, `vitest run` (154/154), `biome check`, `next build` (34 rotas) - todos verdes no lote da Fase 3. Verificação com dado real não realizada (sem banco neste ambiente).
