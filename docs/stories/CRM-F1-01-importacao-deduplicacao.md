# CRM-F1-01 — Cadastro, importação e deduplicação de contatos e empresas

Status: Done (implementado 2026-08-04, aguardando validação com dado real e push do responsável)

## Objetivo

Permitir importar contatos e empresas em lote via CSV, detectando e ignorando duplicados automaticamente — sem exigir intervenção manual linha a linha nem acesso ao banco.

## Contexto atual confirmado

- Cadastro individual (criar/editar/excluir/restaurar) já existia e funciona (`contacts.ts`/`companies.ts`).
- **Nenhuma importação em lote existia.**
- Os índices `contacts_org_email_idx`, `contacts_org_phone_idx` e `companies_org_document_idx` existem no schema desde a fundação, criados exatamente para suportar busca por duplicidade — nenhum código consultava por eles antes desta story (mesmo padrão de "infraestrutura pronta sem uso" já visto várias vezes neste projeto).
- `docs/PLANO_MESTRE_EVOLUCAO_CRM.md` lista "importação e deduplicação" (F1-01) e, mais adiante, "importação, exportação, **merge** e deduplicação" (Módulo B) — nesta story só a importação com deduplicação (ignorar duplicado) foi implementada; merge de registros duplicados existentes é um recurso distinto, maior, fora deste escopo.

## Escopo

- Parser CSV próprio (`src/server/services/csv.ts`), sem dependência nova — RFC 4180 (aspas, vírgula/quebra de linha dentro de campo, aspas escapadas).
- Normalização pura para comparação (`src/server/services/dedup.ts`): e-mail (minúsculas/trim) e dígitos (telefone/CNPJ, remove tudo que não é número).
- `importContacts(csvText)`: cabeçalho `nome,sobrenome,email,telefone,whatsapp,cargo,empresa`. Deduplica por e-mail OU telefone/whatsapp (contra o banco e dentro do próprio arquivo). Coluna `empresa` só **vincula** a uma empresa já cadastrada (match exato de nome fantasia, case-insensitive) — não cria empresa nova a partir do import de contato.
- `importCompanies(csvText)`: cabeçalho `nomeFantasia,razaoSocial,cnpj,email,telefone,site`. Deduplica por CNPJ (se informado) ou nome fantasia exato.
- UI: modal "Importar CSV" (arquivo ou colar texto) em `/crm/contatos` e `/crm/empresas`, com relatório de criados/duplicados ignorados/linhas inválidas.
- Limite de 1000 linhas por importação (proteção simples contra upload acidental de arquivo gigante numa única transação).

## Fora de escopo

- Merge de registros já duplicados existentes no banco (recurso maior, separado).
- Importação de OFX/bancária (isso é F3-08/F4-08, financeiro).
- Exportação (só importação nesta story).
- Criar empresa automaticamente a partir da coluna `empresa` do CSV de contatos, se não existir — decisão deliberada para não gerar empresas "fantasma" por erro de digitação.
- Mapeamento de colunas customizável na UI — cabeçalho fixo, documentado no próprio modal.

## Critérios de aceite verificáveis

- Importar um CSV de contatos válido cria os contatos, ignora os que já existem (mesmo e-mail ou telefone), e reporta contagens exatas.
- Importar um CSV de empresas válido cria as empresas, ignora as que já existem (mesmo CNPJ ou nome fantasia), e reporta contagens exatas.
- Uma linha com e-mail em formato inválido é reportada como "inválida" (não interrompe a importação das demais linhas válidas).
- Duas linhas com o mesmo e-mail dentro do mesmo arquivo: a primeira é importada, a segunda é reportada como duplicada.
- Toda importação exige `contacts.create`/`companies.create` e nunca lê/escreve fora da organização da sessão.
- Tipos, testes e build passam.

## Regras de autorização

- `contacts.create` para importar contatos, `companies.create` para importar empresas — mesmas chaves já usadas na criação individual, sem chave nova.

## Alterações de banco

Nenhuma — reaproveita colunas e índices já existentes.

## Plano de testes

- Unitário: `parseCsv`/`csvToObjects` (aspas, vírgula/quebra de linha embutida, CRLF, aspas escapadas, arquivo vazio) — 10 testes.
- Unitário: `normalizeEmail`/`normalizeDigits` — 6 testes.
- Regressão: suíte completa (`vitest run`) continua verde.
- `tsc --noEmit`, `next build`, `playwright test` verdes.
- Sem banco disponível nesta sessão — sem teste de integração real da importação (mesma limitação recorrente do projeto).

## Migração / Rollback / Feature flag

Nenhuma migração. Reverter o commit remove só as duas actions novas e o botão — nenhum dado tocado além do que qualquer importação real já teria criado (reversível excluindo os registros criados, se necessário).

## Dependências

Nenhuma.

## Riscos

- Deduplicação por nome fantasia exato (quando a empresa não tem CNPJ) não pega variações de grafia ("Pulso" vs "Pulso Ltda") — comportamento esperado de um match exato, não fuzzy; matching mais sofisticado é um upgrade futuro, não um requisito desta story.

## Definition of Done

- Critérios de aceite atendidos.
- Testes de função pura criados e passando (16 novos).
- `tsc`/`vitest`/`playwright`/`build` verdes.
- Sem segredo no diff.
- `IMPLEMENTATION_STATUS.md` atualizado.
- Rollback praticável (reverter commit).

## Dev Agent Record

### File List

- `src/server/services/csv.ts` + `.test.ts` — novo.
- `src/server/services/dedup.ts` + `.test.ts` — novo.
- `src/server/actions/contacts.schemas.ts` — +`importContactRowSchema`.
- `src/server/actions/companies.schemas.ts` — +`importCompanyRowSchema`.
- `src/server/actions/contacts.ts` — +`importContacts`, exporta `ImportResult`.
- `src/server/actions/companies.ts` — +`importCompanies`.
- `src/components/crm/import-csv-modal.tsx` — novo, reutilizado pelas duas telas.
- `src/components/crm/contacts-client.tsx`/`companies-client.tsx` — botão "Importar CSV" + modal.

### Completion Notes

- Deduplicação verifica tanto contra o banco quanto **dentro do próprio arquivo sendo importado** (um CSV com duas linhas de e-mail igual só cria a primeira) — evitado de propósito ler o banco de novo a cada linha (uma query de "todos os contatos/empresas da org" no início, depois tudo em memória).
- Inserção de contatos roda em transação (contato + vínculo `companyContacts`, quando a coluna `empresa` casa com uma empresa existente) — se a etapa de vínculo falhar, o contato não fica órfão sem transação.
- `tsc --noEmit`: limpo. `vitest run`: **100/100** (13 arquivos, +16 novos: 10 de `csv.ts`, 6 de `dedup.ts`). `next build`: verde, 32 rotas (sem rota nova). `biome lint`: 0 erros. `npx playwright test`: 6/6 (suíte de guard/login inalterada).
- **Não validado com dado real**: mesma limitação de `.env`/`DATABASE_URL` já registrada em todas as stories desta sessão — não foi possível logar e testar o upload de um CSV real contra dados reais.
- Nota de ambiente (não relacionada ao código): rodar `next build` enquanto um `next dev` está ativo na mesma pasta corrompe o `.next/dev` do processo dev (ambos escrevem no mesmo diretório). Reiniciar o `next dev` resolve; registrado aqui só como armadilha operacional pra sessões futuras, não é um bug do projeto.