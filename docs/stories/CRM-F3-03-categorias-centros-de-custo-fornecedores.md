# CRM-F3-03 — Categorias, centros de custo e fornecedores

Status: Done (implementado 2026-08-05)

## Objetivo

Dar ao financeiro um plano de contas mínimo (categoria + centro de custo) e um cadastro de fornecedores, sem duplicar o que já existe.

## Achado

Categorias já existiam (`expense_categories`, ligadas a `scope`), mas sem nenhuma action de criação (só seed/leitura). Centros de custo e fornecedores não existiam de nenhuma forma.

## Escopo

- `cost_centers` (novo): nome único por organização, `createCostCenter`/`deactivateCostCenter`/`getCostCenters`.
- `createExpenseCategory` (novo, em `profitability.ts`) - categorias eram só seedadas até aqui.
- Fornecedor reaproveita `companies` (`isVendor: boolean`, novo) em vez de uma tabela `vendors` paralela - uma empresa pode ser cliente e fornecedor ao mesmo tempo, sem duplicar cadastro/documento. `createVendor` (cria uma empresa nova já marcada) e `setCompanyVendorFlag` (marca uma empresa/cliente existente como fornecedora também).
- UI (`CategoriesPanel`) na aba "Categorias e fornecedores".

## Fora de escopo

- Plano de contas hierárquico (categoria pai/filha) - lista plana é suficiente pro volume atual.
- Dados fiscais completos de fornecedor (IE, regime tributário) - só o que já existe em `companies`.

## Critérios de aceite verificáveis

- Criar centro de custo com nome duplicado na mesma organização é rejeitado.
- Marcar uma empresa cliente existente como fornecedora não cria um segundo registro.
- Tipos, testes e build passam.

## Regras de autorização

`cost_centers.read`/`cost_centers.manage`, `vendors.manage` (novas). Categoria usa `profitability.manage_business`/`manage_personal` conforme o `scope`, mesma regra de `createExpense`.

## Alterações de banco

Tabela `cost_centers` (nova) + coluna `companies.is_vendor` (nova), parte de `0011_fase3_financeiro_base.sql`, não aplicada.

## Dev Agent Record

### File List

- `src/server/db/schema/ledger.ts` - `costCenters`.
- `src/server/db/schema/companies.ts` - `isVendor`.
- `src/server/actions/cost-centers.ts` + `.schemas.ts` + `.schemas.test.ts` - novos.
- `src/server/actions/vendors.ts` + `.schemas.ts` + `.schemas.test.ts` - novos.
- `src/server/actions/profitability.ts` - `createExpenseCategory`.
- `src/components/crm/finance/categories-panel.tsx` - novo.

### Completion Notes

`tsc --noEmit`, `vitest run` (154/154), `biome check`, `next build` - todos verdes.
