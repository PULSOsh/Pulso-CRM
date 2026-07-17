import { db } from "./connection";
import { briefingTemplates } from "./schema";

async function runTemplateSeed() {
  console.log("🌱 Starting template seed...");

  // Assume org ID from standard seed (which uses a fixed id or we fetch it)
  // For demo purposes, we will fetch the first org
  const org = await db.query.organizations.findFirst();

  if (!org) {
    console.error("❌ No organization found. Run db:seed first.");
    process.exit(1);
  }

  const templatesToInsert = [
    {
      organizationId: org.id,
      name: "Link na Bio",
      slug: "link-na-bio",
      publicTitle: "Solicitação de Link na Bio",
      publicDescription:
        "Preencha os dados abaixo para configurarmos seu Link na Bio personalizado.",
      status: "published" as const,
    },
    {
      organizationId: org.id,
      name: "Site Essencial",
      slug: "site-essencial",
      publicTitle: "Briefing - Site Essencial",
      publicDescription: "Conte-nos mais sobre o seu negócio para criarmos um site sob medida.",
      status: "published" as const,
    },
    {
      organizationId: org.id,
      name: "Sistema Web / SaaS",
      slug: "sistema-web",
      publicTitle: "Orçamento de Sistema Web / SaaS",
      publicDescription:
        "Precisamos de detalhes sobre a arquitetura e as regras de negócio do seu sistema.",
      status: "published" as const,
    },
  ];

  for (const t of templatesToInsert) {
    await db.insert(briefingTemplates).values(t).onConflictDoNothing();
  }

  console.log("✅ Templates seeded successfully.");
  process.exit(0);
}

runTemplateSeed().catch((err) => {
  console.error("❌ Template seed error:", err);
  process.exit(1);
});
