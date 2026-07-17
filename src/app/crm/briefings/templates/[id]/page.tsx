import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TemplateBuilder } from "@/components/briefings/builder/template-builder";
import { getBriefingTemplateById } from "@/server/actions/briefing-templates";
import { auth } from "@/server/auth";

export default async function BriefingTemplateEditorPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // TODO: Get actual organization ID
  const orgId = "00000000-0000-0000-0000-000000000000";

  const template = await getBriefingTemplateById(params.id, orgId);

  if (!template) {
    // If not found, perhaps it hasn't been seeded yet. We'll show a placeholder or 404
    // For now, let's render the builder with empty state if not found (or return notFound())
    // notFound();
  }

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <header
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 24px",
          display: "flex",
          gap: "24px",
          alignItems: "center",
        }}
      >
        <Link
          href="/crm/briefings/templates"
          style={{
            color: "#64748b",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ArrowLeft size={20} /> Voltar
        </Link>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
            {template?.name || "Novo Template"}
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Status: {template?.status === "published" ? "Publicado" : "Rascunho"}
          </p>
        </div>
      </header>

      <main>
        <TemplateBuilder
          initialQuestions={[
            { id: "1", title: "Qual o nome da sua empresa?", type: "text", isRequired: true },
            { id: "2", title: "Possui logotipo?", type: "radio", isRequired: true },
          ]}
        />
      </main>
    </div>
  );
}
