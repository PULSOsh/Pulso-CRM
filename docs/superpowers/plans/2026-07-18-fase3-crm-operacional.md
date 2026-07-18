# Fase 3 (fatia inicial) — CRM operacional: Implementation Plan

> **Nota sobre execução:** este repo não tem os sub-skills `subagent-driven-development`/`executing-plans`/`plan-document-reviewer` instalados. Este plano será executado inline, seguindo o protocolo de 15 passos por fase do `CLAUDE.md` (raiz do repo), com autorrevisão em vez de um agente revisor dedicado. Cada Grupo de Tarefas abaixo é uma fatia independente e testável — commit local só ao final de cada grupo, quando os checks (lint/typecheck/test/build) passarem e a verificação manual possível tiver sido feita. Nenhum push sem autorização explícita do responsável.

**Goal:** Fechar a lacuna mais crítica entre `docs/MODULE_SPECIFICATIONS.md` e o código real, na ordem de prioridade combinada com o responsável: próxima ação em oportunidades → ganho/perda funcionando → tarefas básicas → editar/excluir contatos e empresas. Isso tira o sistema do estado "inutilizável" sem tentar entregar a Fase 3 inteira de uma vez.

**Architecture:** Segue o padrão já estabelecido no repo: `"use server"` actions em `src/server/actions/*.ts`, cada uma chamando `requirePermission(key)` primeiro e usando o `organizationId`/`userId` retornado (nunca um parâmetro recebido). Nenhuma migration de schema é necessária para os Grupos 1 e 4 (colunas já existem); o Grupo 2 precisa de um ajuste idempotente na seed de estágios do funil (não uma migration de schema); o Grupo 3 é 100% novo (`src/server/actions/tasks.ts`, rota nova, componente novo) sobre uma tabela que já existe.

**Tech Stack:** Next.js App Router (Server Actions), Drizzle ORM + Postgres, Zod (a introduzir para validação — hoje as actions não validam com Zod, só tipos TS soltos), Vitest para lógica pura, `components/ui/*` + tokens Pulso para telas novas.

---

## Convenção de validação usada neste plano

Este projeto não tem banco de teste (só `environment: "jsdom"` no `vitest.config.ts`, sem Postgres de teste). Isso limita o que dá pra testar automaticamente:

- **Lógica pura (validação Zod, cálculo de data vencida, etc.):** teste unitário real, TDD (escrever teste, ver falhar, implementar, ver passar).
- **Server actions que tocam o banco:** validadas por `tsc --noEmit` (contratos de tipo corretos) + `next build` (a action compila e é referenciada corretamente) + revisão manual do SQL gerado. Não têm teste automatizado de banco nesta sessão — seria um projeto à parte (subir Postgres de teste, seed, etc.), fora do escopo combinado.
- **Telas que exigem login:** o app inteiro exige sessão real para qualquer tela de CRM. Quando fizer sentido, uso a técnica já validada nesta sessão — uma rota temporária sem exigir sessão, renderizando o componente isolado com dados falsos, testada via automação de navegador, **deletada antes do commit**. Quando isso não for prático (porque a tela depende de dado real do banco), marco explicitamente como "precisa de confirmação visual do responsável" no critério de pronto — sem fingir que testei o que não testei.

Em todo grupo, ao final: `npm run lint && npm run typecheck && npm run test && npm run build` (equivalente ao `npm run check` do repo) tem que passar limpo antes do commit.

---

## Grupo de Tarefas 1 — Próxima ação na oportunidade

**Por quê primeiro:** campos já existem no schema (`opportunities.nextActionAt`, `opportunities.nextActionDescription`, `src/server/db/schema/opportunities.ts:48-49`), já tem índice dedicado (`opportunities_owner_next_action_idx`). É a lacuna de maior impacto e menor esforço — só falta ação + tela. Sem migration.

**Files:**
- Create: `src/server/actions/opportunities.ts` — novo arquivo. `pipeline.ts` hoje só tem `createOpportunity`/`moveOpportunity`/`getPipelineWithOpportunities`; próxima ação, ganho e perda (Grupo 2) são operações que atuam sobre UMA oportunidade específica, então merecem um arquivo de actions separado por responsabilidade, seguindo a convenção "arquivos que mudam juntos ficam juntos" do `docs/ARCHITECTURE_AND_STANDARDS.md`.
- Create: `src/server/actions/opportunities.schemas.ts` — schemas Zod desse módulo.
- Modify: `src/app/crm/opportunities/[id]/page.tsx` — adicionar seção "Próxima ação" com formulário.
- Modify: `src/components/crm/pipeline/kanban-card.tsx` — mostrar a próxima ação (e destacar se vencida) no card, conforme `docs/MODULE_SPECIFICATIONS.md` §4 "Card".
- Test: `src/server/actions/opportunities.schemas.test.ts`

### Passo 1: Schema Zod para próxima ação (TDD)

Escrever o teste primeiro:

```ts
// src/server/actions/opportunities.schemas.test.ts
import { describe, expect, it } from "vitest";
import { nextActionSchema } from "./opportunities.schemas";

describe("nextActionSchema", () => {
  it("aceita data futura e descrição válidas", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: new Date(Date.now() + 86_400_000).toISOString(),
      nextActionDescription: "Ligar pra confirmar orçamento",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita descrição vazia quando a data é informada", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: new Date().toISOString(),
      nextActionDescription: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita descrição maior que 240 caracteres (limite da coluna varchar)", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: new Date().toISOString(),
      nextActionDescription: "a".repeat(241),
    });
    expect(result.success).toBe(false);
  });

  it("aceita limpar a próxima ação (ambos null)", () => {
    const result = nextActionSchema.safeParse({
      nextActionAt: null,
      nextActionDescription: null,
    });
    expect(result.success).toBe(true);
  });
});
```

Rodar: `npx vitest run src/server/actions/opportunities.schemas.test.ts`
Esperado: FALHA (`Cannot find module './opportunities.schemas'`).

### Passo 2: Implementar o schema

```ts
// src/server/actions/opportunities.schemas.ts
import { z } from "zod";

export const nextActionSchema = z
  .object({
    nextActionAt: z.string().datetime().nullable(),
    nextActionDescription: z.string().trim().min(1).max(240).nullable(),
  })
  .refine((data) => (data.nextActionAt === null) === (data.nextActionDescription === null), {
    message: "Data e descrição da próxima ação devem ser preenchidas juntas ou ambas vazias.",
  });

export type NextActionInput = z.infer<typeof nextActionSchema>;
```

Rodar de novo: `npx vitest run src/server/actions/opportunities.schemas.test.ts`
Esperado: PASS (4/4).

### Passo 3: Server action `updateNextAction`

```ts
// src/server/actions/opportunities.ts
"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { opportunities } from "../db/schema";
import { nextActionSchema } from "./opportunities.schemas";

export async function updateNextAction(
  opportunityId: string,
  input: { nextActionAt: string | null; nextActionDescription: string | null },
) {
  const { organizationId } = await requirePermission("opportunities.update");
  const parsed = nextActionSchema.parse(input);

  const [updated] = await db
    .update(opportunities)
    .set({
      nextActionAt: parsed.nextActionAt ? new Date(parsed.nextActionAt) : null,
      nextActionDescription: parsed.nextActionDescription,
      updatedAt: new Date(),
    })
    .where(and(eq(opportunities.id, opportunityId), eq(opportunities.organizationId, organizationId)))
    .returning({ id: opportunities.id });

  if (!updated) throw new Error("Oportunidade não encontrada.");

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/pipeline");
  return { success: true };
}
```

Note o `and(eq(id), eq(organizationId))` no `where` — igual ao padrão já usado em `moveOpportunity`, garante que ninguém edita oportunidade de outra organização mesmo que descubra o UUID.

### Passo 4: Rodar typecheck

Run: `npx tsc --noEmit`
Esperado: 0 erros.

### Passo 5: UI — formulário de próxima ação na página de detalhe

Modificar `src/app/crm/opportunities/[id]/page.tsx`: adicionar um Client Component `next-action-form.tsx` (form controlado, chama `updateNextAction` via `useTransition`, igual ao padrão de `quote-builder-form.tsx`). Mostrar abaixo do bloco "Informações da Negociação":

```tsx
// src/components/crm/pipeline/next-action-form.tsx
"use client";
import { useState, useTransition } from "react";
import { updateNextAction } from "@/server/actions/opportunities";

export function NextActionForm({
  opportunityId,
  initialAt,
  initialDescription,
}: {
  opportunityId: string;
  initialAt: string | null;
  initialDescription: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [at, setAt] = useState(initialAt ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateNextAction(opportunityId, {
          nextActionAt: at ? new Date(at).toISOString() : null,
          nextActionDescription: description || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="nextActionAt" className="text-sm font-medium text-slate-700">
            Data da próxima ação
          </label>
          <input
            id="nextActionAt"
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-300"
          />
        </div>
        <div>
          <label htmlFor="nextActionDescription" className="text-sm font-medium text-slate-700">
            O que fazer
          </label>
          <input
            id="nextActionDescription"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={240}
            className="w-full h-10 px-3 rounded-lg border border-slate-300"
          />
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Salvando..." : "Salvar próxima ação"}
      </button>
    </form>
  );
}
```

`page.tsx` passa `opp.nextActionAt?.toISOString() ?? null` e `opp.nextActionDescription ?? null` como props.

### Passo 6: Mostrar próxima ação (e atraso) no card do Kanban

Em `kanban-card.tsx`, adicionar um bloco que mostra `opportunity.nextActionDescription` + data formatada, com destaque visual (texto/borda vermelha) se `nextActionAt < new Date()`. Precisa que `getPipelineWithOpportunities` (`pipeline.ts:75-91`) inclua `nextActionAt`/`nextActionDescription` na query — como já usa `db.query.opportunities.findMany` sem `columns` restritivo, essas colunas já vêm por padrão; só falta consumir no componente.

### Passo 7: Checks completos

Run: `npm run lint && npx tsc --noEmit && npx vitest run && npm run build`
Esperado: tudo verde, 0 erros novos.

### Passo 8: Verificação visual (parcial)

Não dá pra testar o fluxo completo (login real + oportunidade real no banco) sem sessão. O que dá pra verificar sem login: montar uma rota temporária `src/app/dev-next-action-preview/page.tsx` renderizando só o `<NextActionForm>` com props fake, confirmar que o form renderiza, aceita input, e que `onSubmit` chama a função esperada (mock de `updateNextAction` via um botão de teste que loga o payload no console em vez de chamar a action real) — depois **deletar a rota antes do commit**. O restante (será que salva no banco de verdade, será que aparece no card) fica marcado como "precisa de confirmação visual do responsável".

### Passo 9: Commit (local, sem push)

```bash
git add src/server/actions/opportunities.ts src/server/actions/opportunities.schemas.ts src/server/actions/opportunities.schemas.test.ts src/components/crm/pipeline/next-action-form.tsx src/components/crm/pipeline/kanban-card.tsx src/app/crm/opportunities/[id]/page.tsx
git commit -m "feat(opportunities): wire up next-action field (form + kanban card)"
```

**Critério de pronto:** checks verdes, teste do schema passando, form renderiza e valida sem erro num teste isolado. Pendente: responsável confirmar visualmente que salvar realmente persiste e que o card mostra atraso.

---

## Grupo de Tarefas 2 — Ganho e Perda funcionando de verdade

**Por quê em segundo:** sem isso, o funil não fecha ciclo nenhum — hoje são botões mortos. Precisa de uma etapa "Perdido" no funil seedado (não existe) antes de fazer sentido perder uma oportunidade.

**Files:**
- Modify: `src/server/actions/pipeline.ts` — adicionar etapa "Perdido" na seed, de forma idempotente.
- Create: `src/server/actions/opportunities.ts` (mesmo arquivo do Grupo 1) — adicionar `winOpportunity`/`loseOpportunity`.
- Create: `src/server/actions/opportunities.schemas.ts` (mesmo arquivo do Grupo 1) — adicionar `loseOpportunitySchema`.
- Create: `src/components/crm/pipeline/win-lose-buttons.tsx`
- Modify: `src/app/crm/opportunities/[id]/page.tsx` — trocar os botões mortos pelo componente novo.
- Test: `src/server/actions/opportunities.schemas.test.ts` (estender)

### Passo 1: Adicionar etapa "Perdido" à seed, idempotente

Modificar `getPipelineWithOpportunities` (`pipeline.ts:9-66`): hoje o `if (!defaultPipeline)` só roda a seed inicial na primeira vez — se a organização já tem pipeline (como a de produção já tem, com as 5 etapas antigas), a etapa "Perdido" nunca vai ser criada. Precisa de uma checagem separada, fora do `if (!defaultPipeline)`, que garanta a etapa mesmo em pipelines já existentes:

```ts
// dentro de getPipelineWithOpportunities, depois do bloco que cria defaultPipeline se não existir:
const hasLostStage = await db.query.pipelineStages.findFirst({
  where: and(eq(pipelineStages.pipelineId, defaultPipeline.id), eq(pipelineStages.isWon, false), eq(pipelineStages.name, "Perdido")),
});
if (!hasLostStage) {
  const [lastStage] = await db.query.pipelineStages.findMany({
    where: eq(pipelineStages.pipelineId, defaultPipeline.id),
    orderBy: [desc(pipelineStages.position)],
    limit: 1,
  });
  await db.insert(pipelineStages).values({
    pipelineId: defaultPipeline.id,
    name: "Perdido",
    position: (lastStage?.position ?? 0) + 1,
    color: "#ef4444",
    probability: 0,
  });
}
```

Isso é idempotente (não duplica se já existir) e não altera as etapas atuais — só adiciona a que falta. Precisa importar `desc` em `pipeline.ts` (já importado na linha 3).

**Decisão de design**: oportunidades perdidas usam `status: "lost"` (já existe no enum `opportunity_status`) — a etapa "Perdido" no Kanban serve só como destino visual do drag-and-drop manual; o botão "Perdido" na tela de detalhe é o caminho principal, que já seta status + moveOpportunity junto. Ambos os caminhos devem levar ao mesmo estado final.

### Passo 2: Estender o schema Zod (TDD)

Adicionar aos testes existentes em `opportunities.schemas.test.ts`:

```ts
describe("loseOpportunitySchema", () => {
  it("exige motivo de perda", () => {
    const result = loseOpportunitySchema.safeParse({ lostReason: "" });
    expect(result.success).toBe(false);
  });

  it("aceita motivo preenchido", () => {
    const result = loseOpportunitySchema.safeParse({ lostReason: "Cliente escolheu concorrente" });
    expect(result.success).toBe(true);
  });

  it("rejeita motivo maior que 180 caracteres (limite da coluna)", () => {
    const result = loseOpportunitySchema.safeParse({ lostReason: "a".repeat(181) });
    expect(result.success).toBe(false);
  });
});
```

Run: `npx vitest run src/server/actions/opportunities.schemas.test.ts` → FALHA (import ausente).

Implementar:

```ts
export const loseOpportunitySchema = z.object({
  lostReason: z.string().trim().min(1, "Motivo da perda é obrigatório.").max(180),
});
export type LoseOpportunityInput = z.infer<typeof loseOpportunitySchema>;
```

Run de novo → PASS.

### Passo 3: `winOpportunity` e `loseOpportunity` (transação real)

```ts
// src/server/actions/opportunities.ts (continuação)
import { pipelineStages } from "../db/schema";
import { opportunityStageHistory } from "../db/schema";
import { loseOpportunitySchema } from "./opportunities.schemas";

export async function winOpportunity(opportunityId: string) {
  const { organizationId, userId } = await requirePermission("opportunities.win");

  await db.transaction(async (tx) => {
    const opp = await tx.query.opportunities.findFirst({
      where: and(eq(opportunities.id, opportunityId), eq(opportunities.organizationId, organizationId)),
    });
    if (!opp) throw new Error("Oportunidade não encontrada.");
    if (opp.status !== "open") throw new Error("Só é possível ganhar uma oportunidade em aberto.");

    const wonStage = await tx.query.pipelineStages.findFirst({
      where: and(eq(pipelineStages.pipelineId, opp.pipelineId), eq(pipelineStages.isWon, true)),
    });

    await tx
      .update(opportunities)
      .set({
        status: "won",
        wonAt: new Date(),
        stageId: wonStage?.id ?? opp.stageId,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId));

    if (wonStage && wonStage.id !== opp.stageId) {
      await tx.insert(opportunityStageHistory).values({
        opportunityId,
        fromStageId: opp.stageId,
        toStageId: wonStage.id,
        movedBy: userId,
        reason: "Marcado como Ganho",
      });
    }
  });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/pipeline");
  return { success: true };
}

export async function loseOpportunity(opportunityId: string, input: { lostReason: string }) {
  const { organizationId, userId } = await requirePermission("opportunities.lose");
  const parsed = loseOpportunitySchema.parse(input);

  await db.transaction(async (tx) => {
    const opp = await tx.query.opportunities.findFirst({
      where: and(eq(opportunities.id, opportunityId), eq(opportunities.organizationId, organizationId)),
    });
    if (!opp) throw new Error("Oportunidade não encontrada.");
    if (opp.status !== "open") throw new Error("Só é possível perder uma oportunidade em aberto.");

    const lostStage = await tx.query.pipelineStages.findFirst({
      where: and(eq(pipelineStages.pipelineId, opp.pipelineId), eq(pipelineStages.name, "Perdido")),
    });

    await tx
      .update(opportunities)
      .set({
        status: "lost",
        lostAt: new Date(),
        lostReason: parsed.lostReason,
        stageId: lostStage?.id ?? opp.stageId,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId));

    if (lostStage && lostStage.id !== opp.stageId) {
      await tx.insert(opportunityStageHistory).values({
        opportunityId,
        fromStageId: opp.stageId,
        toStageId: lostStage.id,
        movedBy: userId,
        reason: parsed.lostReason,
      });
    }
  });

  revalidatePath(`/crm/opportunities/${opportunityId}`);
  revalidatePath("/crm/pipeline");
  return { success: true };
}
```

Por que `db.transaction`: ganhar/perder muda `opportunities` E grava `opportunity_stage_history` — se a segunda escrita falhar, a primeira não pode ficar órfã. Isso corrige, de quebra, um gap que a auditoria achou em `moveOpportunity` (que faz as duas escritas fora de transação) — mas **não vou mexer em `moveOpportunity` neste grupo** para manter o escopo pequeno; registro como débito conhecido no `IMPLEMENTATION_STATUS.md` ao final.

### Passo 4: Checagem de status antes de agir

Note os `if (opp.status !== "open") throw ...` acima — implementam a regra do `docs/QUALITY_AND_ACCEPTANCE.md` §6 ("contrato já assinado", equivalente aqui: oportunidade já fechada não pode ser fechada de novo). Isso cobre o caso negativo "operação repetida".

### Passo 5: Componente `WinLoseButtons` com modal de motivo

```tsx
// src/components/crm/pipeline/win-lose-buttons.tsx
"use client";
import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { winOpportunity, loseOpportunity } from "@/server/actions/opportunities";

export function WinLoseButtons({ opportunityId, status }: { opportunityId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status !== "open") {
    return (
      <p className="text-sm text-slate-500">
        Esta oportunidade já está {status === "won" ? "ganha" : "perdida"}.
      </p>
    );
  }

  function handleWin() {
    setError(null);
    startTransition(async () => {
      try {
        await winOpportunity(opportunityId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao marcar como ganho.");
      }
    });
  }

  function handleLose(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await loseOpportunity(opportunityId, { lostReason });
        setShowLoseModal(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao marcar como perdido.");
      }
    });
  }

  return (
    <div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleWin}
          disabled={isPending}
          className="flex-1 bg-green-50 text-green-700 border border-green-200 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 size={20} /> Ganho
        </button>
        <button
          type="button"
          onClick={() => setShowLoseModal(true)}
          disabled={isPending}
          className="flex-1 bg-red-50 text-red-700 border border-red-200 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <XCircle size={20} /> Perdido
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      {showLoseModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleLose}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="font-semibold text-lg">Motivo da perda</h3>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              required
              maxLength={180}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Ex: Cliente escolheu concorrente por preço"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLoseModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
              >
                Confirmar perda
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```

Substituir em `opportunities/[id]/page.tsx` o bloco "Ações (Em breve)" por `<WinLoseButtons opportunityId={opp.id} status={opp.status} />`.

### Passo 6: Checks completos

Run: `npm run lint && npx tsc --noEmit && npx vitest run && npm run build`

### Passo 7: Verificação visual (parcial, mesma técnica do Grupo 1)

Rota temporária renderizando `<WinLoseButtons>` com `status="open"` fake, confirmar que o modal de perda abre, exige preencher o motivo, e (com a action mockada) chama a função certa. Deletar antes do commit. Fluxo real de ponta a ponta (mudança de status persistindo, etapa "Perdido" aparecendo no Kanban) fica marcado como pendente de confirmação do responsável.

### Passo 8: Commit

```bash
git add src/server/actions/pipeline.ts src/server/actions/opportunities.ts src/server/actions/opportunities.schemas.ts src/server/actions/opportunities.schemas.test.ts src/components/crm/pipeline/win-lose-buttons.tsx src/app/crm/opportunities/[id]/page.tsx
git commit -m "feat(opportunities): wire up win/lose with real transaction and history"
```

**Critério de pronto:** checks verdes, schema testado, etapa "Perdido" adicionada de forma idempotente (não duplica se rodar de novo), transação cobre update+history juntos. Pendente: confirmação visual do responsável em produção/ambiente com sessão real.

---

## Grupo de Tarefas 3 — Tarefas básicas

**Por quê em terceiro:** maior peça nova (schema existe, zero de ação/UI/rota). Escopo combinado: criar, listar "minhas tarefas" e "atrasadas", vincular a uma oportunidade. Sem calendário/recorrência ainda.

**Files:**
- Modify: `src/server/db/schema/tasks.ts` — corrigir `projectId` sem `.references()` (achado da auditoria — bug real de integridade, pequeno o bastante pra corrigir de passagem já que estou mexendo neste arquivo).
- Create: migration para o fix acima (`npx drizzle-kit generate`).
- Create: `src/server/actions/tasks.ts`
- Create: `src/server/actions/tasks.schemas.ts`
- Create: `src/app/crm/tarefas/page.tsx`
- Create: `src/components/crm/tasks/tasks-client.tsx`
- Modify: `src/components/crm/app-shell.tsx` — trocar `href: "#"` de Tarefas por `/crm/tarefas`.
- Test: `src/server/actions/tasks.schemas.test.ts`

### Passo 1: Corrigir a FK de `projectId` em tasks

```ts
// src/server/db/schema/tasks.ts — trocar:
projectId: uuid("project_id"),
// por:
projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
```
Precisa importar `projects` de `./projects` no topo do arquivo. Gerar migration:

Run: `npx drizzle-kit generate`
Esperado: gera um novo arquivo em `src/server/db/migrations/` adicionando a constraint FK. **Não aplicar em produção nesta sessão** — só gerar e deixar pronta; aplicação é uma ação que precisa de autorização explícita do responsável conforme `docs/runbooks/production-safety.md`, e vou avisar antes de qualquer `drizzle-kit migrate` contra o banco real.

### Passo 2: Schemas Zod (TDD)

```ts
// src/server/actions/tasks.schemas.test.ts
import { describe, expect, it } from "vitest";
import { createTaskSchema } from "./tasks.schemas";

describe("createTaskSchema", () => {
  it("exige título", () => {
    expect(createTaskSchema.safeParse({ title: "" }).success).toBe(false);
  });
  it("aceita só o título (resto opcional)", () => {
    expect(createTaskSchema.safeParse({ title: "Ligar pro cliente" }).success).toBe(true);
  });
  it("rejeita prioridade inválida", () => {
    const result = createTaskSchema.safeParse({ title: "X", priority: "critica" });
    expect(result.success).toBe(false);
  });
  it("aceita prioridade e prazo válidos", () => {
    const result = createTaskSchema.safeParse({
      title: "X",
      priority: "urgent",
      dueAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});
```

Run → FALHA. Implementar:

```ts
// src/server/actions/tasks.schemas.ts
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório.").max(220),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dueAt: z.string().datetime().optional(),
  assignedTo: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

Run de novo → PASS.

### Passo 3: Server actions

```ts
// src/server/actions/tasks.ts
"use server";

import { and, eq, isNull, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { tasks } from "../db/schema";
import { createTaskSchema } from "./tasks.schemas";

export async function createTask(input: unknown) {
  const { organizationId, userId } = await requirePermission("tasks.create");
  const parsed = createTaskSchema.parse(input);

  const [task] = await db
    .insert(tasks)
    .values({
      organizationId,
      createdBy: userId,
      assignedTo: parsed.assignedTo ?? userId,
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority ?? "normal",
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : undefined,
      opportunityId: parsed.opportunityId,
      companyId: parsed.companyId,
      contactId: parsed.contactId,
    })
    .returning();

  revalidatePath("/crm/tarefas");
  return task;
}

export async function getMyTasks() {
  const { organizationId, userId } = await requirePermission("tasks.read");

  return await db.query.tasks.findMany({
    where: and(
      eq(tasks.organizationId, organizationId),
      eq(tasks.assignedTo, userId),
      eq(tasks.status, "todo"),
    ),
    orderBy: (tasks, { asc }) => [asc(tasks.dueAt)],
    with: { opportunity: { columns: { title: true } } },
  });
}

export async function getOverdueTasks() {
  const { organizationId, userId } = await requirePermission("tasks.read");

  return await db.query.tasks.findMany({
    where: and(
      eq(tasks.organizationId, organizationId),
      eq(tasks.assignedTo, userId),
      eq(tasks.status, "todo"),
      lt(tasks.dueAt, new Date()),
    ),
    orderBy: (tasks, { asc }) => [asc(tasks.dueAt)],
  });
}

export async function completeTask(taskId: string) {
  const { organizationId } = await requirePermission("tasks.complete");

  const [updated] = await db
    .update(tasks)
    .set({ status: "done", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)))
    .returning({ id: tasks.id });

  if (!updated) throw new Error("Tarefa não encontrada.");

  revalidatePath("/crm/tarefas");
  return { success: true };
}
```

Note: `tasks` precisa ter uma relação Drizzle (`relations.ts`) para `opportunity` funcionar no `with:` acima — checar `src/server/db/schema/relations.ts` e adicionar `opportunity: one(opportunities, ...)` se ainda não existir (memória de sessões anteriores registra que isso já mordeu o projeto antes: "Drizzle relational queries precisam de `relations()` definidas, não basta `.references()`").

### Passo 4: Checagem "conclusão registra autor" (gap parcial da auditoria)

A auditoria encontrou que `completedAt` existe mas não há coluna para "quem completou". **Não vou adicionar coluna nova neste grupo** (mudaria o schema além do combinado) — registro como débito conhecido; hoje "quem completou" fica implícito por `updatedAt`/logs, não por coluna dedicada.

### Passo 5: Rota e componente de lista

```tsx
// src/app/crm/tarefas/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getMyTasks, getOverdueTasks } from "@/server/actions/tasks";
import { TasksClient } from "@/components/crm/tasks/tasks-client";

export default async function TarefasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [myTasks, overdueTasks] = await Promise.all([getMyTasks(), getOverdueTasks()]);

  return <TasksClient myTasks={myTasks} overdueTasks={overdueTasks} />;
}
```

`tasks-client.tsx`: dois toggles ("Minhas tarefas" / "Atrasadas"), lista simples com título, prazo formatado (`date-fns`), botão "Concluir" chamando `completeTask` via `useTransition` + `router.refresh()`, e um form de criação rápida (só título + prazo opcional) chamando `createTask`.

### Passo 6: Corrigir o link morto no menu

```tsx
// src/components/crm/app-shell.tsx — trocar:
{ href: "#", label: "Tarefas", key: "tasks", icon: CheckSquare },
// por:
{ href: "/crm/tarefas", label: "Tarefas", key: "tasks", icon: CheckSquare },
```
Isso já basta — o filtro `href !== "#"` em `group()` já para de esconder automaticamente assim que o href deixa de ser `"#"`. Adicionar `"tasks"` em `ActiveKey` (já está lá) e passar `active="tasks"` na página nova.

### Passo 7: Checks completos

Run: `npm run lint && npx tsc --noEmit && npx vitest run && npm run build`

### Passo 8: Verificação visual

Mesma técnica: rota temporária com `<TasksClient>` recebendo arrays fake de tarefas (uma no prazo, uma atrasada), confirmar visualmente que a lista renderiza, o toggle funciona, e o botão concluir dispara a função esperada (mockada). Deletar antes do commit. Fluxo real (criar/completar tarefa de verdade, aparecer no lugar certo) fica pendente de confirmação do responsável.

### Passo 9: Commit

```bash
git add src/server/db/schema/tasks.ts src/server/db/migrations/ src/server/actions/tasks.ts src/server/actions/tasks.schemas.ts src/server/actions/tasks.schemas.test.ts src/app/crm/tarefas/ src/components/crm/tasks/ src/components/crm/app-shell.tsx
git commit -m "feat(tasks): add basic task CRUD (my tasks, overdue, complete) and enable nav link"
```

**Critério de pronto:** checks verdes, schemas testados, migration gerada (não aplicada), link do menu funcional. Pendente: aplicar a migration em produção (pedir autorização antes), e confirmação visual do responsável no fluxo real.

---

## Grupo de Tarefas 4 — Contatos e Empresas: editar e excluir

**Por quê por último:** já existe criar+listar; isso é "fechar o básico", mas o sistema já é parcialmente usável sem isso (dá pra cadastrar, só não pra corrigir erro de digitação ou tirar duplicata da lista).

**Files:**
- Modify: `src/server/actions/contacts.ts` — adicionar `updateContact`, `deleteContact`; corrigir `getContacts` para filtrar `deletedAt IS NULL`.
- Modify: `src/server/actions/companies.ts` — mesmo, para empresas.
- Create: `src/server/actions/contacts.schemas.ts`, `src/server/actions/companies.schemas.ts`
- Modify: `src/components/crm/contacts-client.tsx` — modo de edição no modal existente + botão excluir com confirmação.
- Modify: `src/components/crm/companies-client.tsx` — idem.
- Test: `src/server/actions/contacts.schemas.test.ts`, `src/server/actions/companies.schemas.test.ts`

### Passo 1: Schemas Zod (TDD, mesmo padrão dos grupos anteriores)

```ts
// src/server/actions/contacts.schemas.ts
import { z } from "zod";

export const updateContactSchema = z.object({
  firstName: z.string().trim().min(1, "Nome é obrigatório.").max(100),
  lastName: z.string().trim().max(120).optional(),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional(),
  whatsapp: z.string().trim().max(32).optional(),
  jobTitle: z.string().trim().max(120).optional(),
});
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
```

Testes seguindo o mesmo padrão do Grupo 1 (nome obrigatório, e-mail com formato inválido rejeitado, campos opcionais aceitos vazios). Mesma coisa para `companies.schemas.ts` com `tradeName` obrigatório.

### Passo 2: `updateContact`/`deleteContact`

```ts
// src/server/actions/contacts.ts — adicionar:
export async function updateContact(contactId: string, input: unknown) {
  const { organizationId } = await requirePermission("contacts.update");
  const parsed = updateContactSchema.parse(input);

  const [updated] = await db
    .update(contacts)
    .set({ ...parsed, updatedAt: new Date() })
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .returning({ id: contacts.id });

  if (!updated) throw new Error("Contato não encontrado.");
  revalidatePath("/crm/contatos");
  return { success: true };
}

export async function deleteContact(contactId: string) {
  const { organizationId } = await requirePermission("contacts.delete");

  const [updated] = await db
    .update(contacts)
    .set({ deletedAt: new Date() })
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .returning({ id: contacts.id });

  if (!updated) throw new Error("Contato não encontrado.");
  revalidatePath("/crm/contatos");
  return { success: true };
}
```

E corrigir `getContacts` pra excluir soft-deleted:

```ts
export async function getContacts() {
  const { organizationId } = await requirePermission("contacts.read");
  return await db.query.contacts.findMany({
    where: and(eq(contacts.organizationId, organizationId), isNull(contacts.deletedAt)),
    orderBy: (contacts, { desc }) => [desc(contacts.createdAt)],
  });
}
```
(precisa importar `and`, `isNull` de `drizzle-orm`). Espelhar tudo isso em `companies.ts`.

**Nota de escopo:** não implemento `restoreContact`/`restoreCompany` neste grupo (não foi pedido na prioridade combinada) — fica registrado como débito, mas com o `deletedAt` já sendo respeitado no filtro, pelo menos o soft-delete passa a ser real (hoje é uma coluna morta).

### Passo 3: UI — edição e exclusão

Em `contacts-client.tsx`: o modal de criação já existe (`isModalOpen`/`handleSubmit`) — adicionar um estado `editingContact: Contact | null`; ao clicar em "Editar" numa linha da lista, abrir o mesmo modal pré-preenchido, e no submit chamar `updateContact` em vez de `createContact` quando `editingContact` não for nulo. Botão "Excluir" com `window.confirm("Excluir este contato?")` antes de chamar `deleteContact` (confirmação simples — um modal de confirmação mais elaborado fica pra quando o design system for migrado de verdade). Mesmo padrão em `companies-client.tsx`.

### Passo 4: Checks completos

Run: `npm run lint && npx tsc --noEmit && npx vitest run && npm run build`

### Passo 5: Verificação visual

Mesma técnica de rota temporária: renderizar `<ContactsClient>`/`<CompaniesClient>` com uma lista fake, confirmar que os botões de editar/excluir aparecem e dependem corretamente do estado (modal abre pré-preenchido, confirm aparece antes de excluir). Fluxo real (editar e ver persistir, excluir e sumir da lista) fica pendente de confirmação do responsável.

### Passo 6: Commit

```bash
git add src/server/actions/contacts.ts src/server/actions/contacts.schemas.ts src/server/actions/contacts.schemas.test.ts src/server/actions/companies.ts src/server/actions/companies.schemas.ts src/server/actions/companies.schemas.test.ts src/components/crm/contacts-client.tsx src/components/crm/companies-client.tsx
git commit -m "feat(contacts,companies): add edit and soft-delete, stop listing deleted rows"
```

**Critério de pronto:** checks verdes, schemas testados, soft-delete de fato filtra a listagem. Pendente: confirmação visual do responsável no fluxo real logado.

---

## Depois dos 4 grupos

Atualizar `IMPLEMENTATION_STATUS.md` com uma seção nova documentando o que foi feito, os débitos conscientemente deixados de fora (restore de contato/empresa, transação em `moveOpportunity`, coluna "completed_by" em tarefas, calendário/recorrência), e a migration pendente de aplicação (fix da FK `tasks.projectId`). Pedir autorização do responsável antes de qualquer push e antes de aplicar a migration em produção — nenhum dos dois é automático mesmo depois de todos os grupos prontos.
