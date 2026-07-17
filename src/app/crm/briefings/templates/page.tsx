import { ExternalLink, FileText, Plus, Settings2 } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getBriefingTemplates } from "@/server/actions/briefing-templates";
import { auth } from "@/server/auth";

export default async function BriefingTemplatesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const templates = await getBriefingTemplates().catch(() => []);

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>Templates de Briefing</h2>
          <p style={{ color: "#64748b" }}>Gerencie os formulários públicos de captação</p>
        </div>
        <button
          type="button"
          className="primary-button"
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
        >
          <Plus size={16} /> Novo Template
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        {templates.length === 0 && (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              border: "1px dashed #cbd5e1",
              borderRadius: "8px",
              gridColumn: "1 / -1",
            }}
          >
            <FileText size={48} style={{ color: "#cbd5e1", margin: "0 auto 16px" }} />
            <h3>Nenhum template encontrado</h3>
            <p style={{ color: "#64748b", marginBottom: "16px" }}>
              Crie seu primeiro template ou aguarde o seed do sistema.
            </p>
          </div>
        )}

        {templates.map((template) => (
          <div
            key={template.id}
            className="card"
            style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <h3 style={{ fontWeight: 600, fontSize: "18px" }}>{template.name}</h3>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: template.status === "published" ? "#dcfce7" : "#f1f5f9",
                  color: template.status === "published" ? "#166534" : "#475569",
                }}
              >
                {template.status === "published" ? "Publicado" : "Rascunho"}
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Slug: /{template.slug}</p>
            <div style={{ marginTop: "auto", display: "flex", gap: "12px" }}>
              <Link
                href={`/crm/briefings/templates/${template.id}`}
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  textDecoration: "none",
                  color: "#0f172a",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                <Settings2 size={16} /> Configurar
              </Link>
              <Link
                href={`/solicitar/${template.slug}`}
                target="_blank"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  color: "#64748b",
                }}
              >
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
