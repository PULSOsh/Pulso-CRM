import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/connection";
import {
  briefingSubmissionAnswers,
  briefingSubmissions,
  briefingTemplates,
} from "@/server/db/schema";

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

    // Generate Protocol: PULSO-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const protocol = `PULSO-${dateStr}-${randomCode}`;

    // Create submission record
    const [submission] = await db
      .insert(briefingSubmissions)
      .values({
        organizationId: template.organizationId,
        templateId: template.id,
        templateVersionId: template.publishedVersionId || "00000000-0000-0000-0000-000000000000", // Fallback for MVP if not set
        protocol,
        status: "started", // MVP, could be 'completed'
        source: "public_site",
        contactName: answers.q_name || "Desconhecido",
        contactEmail: answers.q_email || "",
        companyName: answers.q_company || "",
        metadata: { userAgent: req.headers.get("user-agent") },
      })
      .returning();

    // Insert answers
    const answersToInsert = Object.entries(answers).map(([key, value]) => ({
      submissionId: submission.id,
      questionId: "00000000-0000-0000-0000-000000000000", // MVP fallback since we mocked questions
      questionKey: key,
      value: value as unknown,
    }));

    if (answersToInsert.length > 0) {
      await db.insert(briefingSubmissionAnswers).values(answersToInsert);
    }

    return NextResponse.json({ success: true, protocol });
  } catch (error) {
    console.error("Briefing submit error:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
