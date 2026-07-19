import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/connection";
import { briefingSubmissions, briefingTemplates } from "@/server/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, answers } = body;

    if (!templateId || !answers) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    // Verify if template exists and is published
    const template = await db.query.briefingTemplates.findFirst({
      where: eq(briefingTemplates.id, templateId),
    });

    if (template?.status !== "published") {
      return NextResponse.json({ error: "Template não encontrado ou inativo." }, { status: 404 });
    }

    if (!template.publishedVersionId) {
      // Sem versão publicada não há como gravar templateVersionId (FK
      // obrigatória) - melhor recusar com um erro claro do que gravar um
      // id falso que nunca existiria na tabela de versões.
      return NextResponse.json(
        { error: "Este formulário ainda não está pronto para receber respostas." },
        { status: 409 },
      );
    }

    // Generate Protocol: PULSO-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const protocol = `PULSO-${dateStr}-${randomCode}`;

    // As respostas ficam em `metadata.answers` (jsonb, sem FK) em vez da
    // tabela normalizada `briefing_submission_answers`, que exige um
    // `question_id` real apontando pra `briefing_questions` - tabela ainda
    // não populada (o catálogo de perguntas por template vive no snapshot
    // da versão, não em linhas individuais). Normalizar é debt conhecido,
    // não um bloqueio: os dados brutos continuam auditáveis aqui.
    await db.insert(briefingSubmissions).values({
      organizationId: template.organizationId,
      templateId: template.id,
      templateVersionId: template.publishedVersionId,
      protocol,
      status: "submitted",
      source: "public_site",
      contactName: answers.q_name || "Desconhecido",
      contactEmail: answers.q_email || "",
      contactPhone: answers.q_whatsapp || null,
      companyName: answers.q_company || "",
      completionPercent: 100,
      submittedAt: new Date(),
      metadata: { userAgent: req.headers.get("user-agent"), answers },
    });

    return NextResponse.json({ success: true, protocol });
  } catch (error) {
    console.error("Briefing submit error:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
