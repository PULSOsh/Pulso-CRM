"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { pipelineLossReasons } from "../db/schema";

// Motivos padrão semeados na primeira vez que a organização lista motivos de
// perda (mesmo padrão idempotente de ensureDefaultPipeline em pipeline.ts).
const DEFAULT_LOSS_REASONS = [
  "Preço",
  "Escolheu concorrente",
  "Sem orçamento",
  "Sem retorno do cliente",
  "Fora do escopo",
  "Timing / não é o momento",
];

async function ensureDefaultLossReasons(organizationId: string) {
  const existing = await db.query.pipelineLossReasons.findMany({
    where: eq(pipelineLossReasons.organizationId, organizationId),
  });
  if (existing.length > 0) return existing;

  return db
    .insert(pipelineLossReasons)
    .values(DEFAULT_LOSS_REASONS.map((label) => ({ organizationId, label })))
    .returning();
}

export async function getLossReasons() {
  const { organizationId } = await requirePermission("opportunities.read");
  const reasons = await ensureDefaultLossReasons(organizationId);

  return reasons
    .filter((r) => r.isActive)
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export async function createLossReason(label: string) {
  const { organizationId } = await requirePermission("pipelines.manage");
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Motivo é obrigatório.");
  if (trimmed.length > 120) throw new Error("Motivo muito longo (máx. 120 caracteres).");

  const [reason] = await db
    .insert(pipelineLossReasons)
    .values({ organizationId, label: trimmed })
    .onConflictDoUpdate({
      target: [pipelineLossReasons.organizationId, pipelineLossReasons.label],
      set: { isActive: true, updatedAt: new Date() },
    })
    .returning();

  revalidatePath("/crm/pipeline");
  return reason;
}

export async function deactivateLossReason(id: string) {
  const { organizationId } = await requirePermission("pipelines.manage");

  const [updated] = await db
    .update(pipelineLossReasons)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(eq(pipelineLossReasons.id, id), eq(pipelineLossReasons.organizationId, organizationId)),
    )
    .returning({ id: pipelineLossReasons.id });

  if (!updated) throw new Error("Motivo não encontrado.");

  revalidatePath("/crm/pipeline");
  return { success: true };
}
