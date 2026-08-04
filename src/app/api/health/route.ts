import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/server/db/connection";
import { logger } from "@/server/logger";

/**
 * CRM-F0-09: fecha a dívida técnica listada em
 * docs/PLANO_MESTRE_EVOLUCAO_CRM.md §13 ("incluir identificação de
 * versão/commit no health endpoint") e corrige o health check retornando
 * "ok" incondicionalmente, sem checar nada de verdade - inútil pra
 * monitoramento real (um serviço com banco fora do ar continuava
 * respondendo 200 "ok").
 */
export async function GET() {
  const startedAt = Date.now();
  let databaseStatus: "ok" | "unreachable" = "ok";

  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    databaseStatus = "unreachable";
    logger.error("Health check: banco inacessível", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const status = databaseStatus === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      service: "pulso-crm",
      version: process.env.npm_package_version ?? null,
      commit: process.env.COMMIT_SHA ?? null,
      database: databaseStatus,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: status === "ok" ? 200 : 503 },
  );
}
