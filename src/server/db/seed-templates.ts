import { eq } from "drizzle-orm";
import { db } from "./connection";
import { briefingTemplates, briefingTemplateVersions } from "./schema";

type QuestionDef = {
  id: string;
  type: "text" | "email" | "textarea" | "radio" | "checkbox" | "select" | "file";
  title: string;
  isRequired: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

type SectionDef = {
  id: string;
  title: string;
  description?: string;
  questions: QuestionDef[];
};

const siteEssencialSections: SectionDef[] = [
  {
    id: "sec_negocio",
    title: "Seu negócio",
    description: "Conte um pouco sobre você e seu negócio.",
    questions: [
      {
        id: "q_name",
        type: "text",
        title: "Seu nome",
        isRequired: true,
        placeholder: "Como podemos chamar você?",
      },
      {
        id: "q_whatsapp",
        type: "text",
        title: "WhatsApp",
        isRequired: true,
        placeholder: "(00) 00000-0000",
      },
      {
        id: "q_email",
        type: "email",
        title: "E-mail",
        isRequired: true,
        placeholder: "voce@empresa.com",
      },
      {
        id: "q_company",
        type: "text",
        title: "Nome do negócio ou projeto",
        isRequired: true,
        placeholder: "Nome da empresa, marca ou ideia",
      },
      {
        id: "q_has_site",
        type: "select",
        title: "O negócio já possui site?",
        isRequired: false,
        options: [
          { label: "Não tenho site ainda", value: "none" },
          { label: "Tenho, mas quero refazer", value: "redo" },
          { label: "Tenho e quero manter a base", value: "keep" },
        ],
      },
    ],
  },
  {
    id: "sec_projeto",
    title: "Sobre o projeto",
    description: "Precisamos entender o que você imagina.",
    questions: [
      {
        id: "q_project_type",
        type: "radio",
        title: "O que você precisa?",
        isRequired: true,
        options: [
          { label: "Site institucional", value: "site" },
          { label: "Landing page", value: "landing" },
          { label: "Sistema web / aplicação", value: "sistema" },
          { label: "Catálogo digital", value: "catalogo" },
          { label: "Ainda não sei, preciso de orientação", value: "outro" },
        ],
      },
      {
        id: "q_description",
        type: "textarea",
        title: "Descreva o que você imagina",
        isRequired: true,
        placeholder: "O que o site ou sistema precisa fazer pelo seu negócio?",
      },
      {
        id: "q_references",
        type: "textarea",
        title: "Tem referências ou exemplos que gosta?",
        isRequired: false,
        placeholder: "Links de sites, concorrentes ou inspirações (opcional)",
      },
    ],
  },
  {
    id: "sec_escopo",
    title: "Escopo e prioridades",
    description: "O que não pode faltar nesta primeira versão.",
    questions: [
      {
        id: "q_features",
        type: "checkbox",
        title: "Quais recursos são importantes?",
        isRequired: false,
        options: [
          { label: "Blog ou área de conteúdo", value: "blog" },
          { label: "Loja ou pagamentos online", value: "payments" },
          { label: "Área de login para clientes", value: "auth" },
          { label: "Integração com WhatsApp", value: "whatsapp" },
          { label: "Painel administrativo", value: "dashboard" },
        ],
      },
      {
        id: "q_urgency",
        type: "radio",
        title: "Qual a urgência?",
        isRequired: true,
        options: [
          { label: "Baixa — ainda estou explorando", value: "low" },
          { label: "Média — nos próximos 3 meses", value: "medium" },
          { label: "Alta — preciso o quanto antes", value: "high" },
        ],
      },
    ],
  },
  {
    id: "sec_investimento",
    title: "Investimento",
    description: "Últimos detalhes antes de enviar.",
    questions: [
      {
        id: "q_budget",
        type: "select",
        title: "Já tem uma faixa de orçamento em mente?",
        isRequired: false,
        options: [
          { label: "Ainda não sei", value: "unknown" },
          { label: "Até R$ 1.500", value: "0-1500" },
          { label: "R$ 1.500 a R$ 3.000", value: "1500-3000" },
          { label: "R$ 3.000 a R$ 6.000", value: "3000-6000" },
          { label: "Acima de R$ 6.000", value: "6000+" },
        ],
      },
      {
        id: "q_source",
        type: "text",
        title: "Como você conheceu a PULSO?",
        isRequired: false,
        placeholder: "Indicação, Instagram, Google...",
      },
    ],
  },
];

async function runTemplateSeed() {
  console.log("🌱 Starting template seed...");

  const org = await db.query.organizations.findFirst();

  if (!org) {
    console.error("❌ No organization found. Run db:seed first.");
    process.exit(1);
  }

  const templatesToInsert = [
    {
      slug: "site-essencial",
      name: "Site Essencial",
      publicTitle: "Briefing - Site Essencial",
      publicDescription: "Conte-nos mais sobre o seu negócio para criarmos um site sob medida.",
      sections: siteEssencialSections,
    },
  ];

  for (const t of templatesToInsert) {
    const existing = await db.query.briefingTemplates.findFirst({
      where: (tbl, { eq }) => eq(tbl.slug, t.slug),
    });

    let templateId = existing?.id;

    if (!existing) {
      const [inserted] = await db
        .insert(briefingTemplates)
        .values({
          organizationId: org.id,
          name: t.name,
          slug: t.slug,
          publicTitle: t.publicTitle,
          publicDescription: t.publicDescription,
          status: "published",
        })
        .returning();
      templateId = inserted.id;
      console.log(`✅ Template criado: ${t.slug}`);
    } else {
      console.log(`↷ Template ${t.slug} já existe, reaproveitando id`);
    }

    if (!templateId) continue;

    // Idempotente: só cria uma versão publicada se o template ainda não
    // aponta pra nenhuma - reaplicar o seed não duplica versões.
    if (!existing?.publishedVersionId) {
      const [version] = await db
        .insert(briefingTemplateVersions)
        .values({
          templateId,
          versionNumber: 1,
          snapshot: { sections: t.sections },
          publishedAt: new Date(),
        })
        .returning();

      await db
        .update(briefingTemplates)
        .set({ publishedVersionId: version.id })
        .where(eq(briefingTemplates.id, templateId));

      console.log(`✅ Versão publicada criada e vinculada: ${t.slug}`);
    }
  }

  console.log("✅ Templates seeded successfully.");
  process.exit(0);
}

runTemplateSeed().catch((err) => {
  console.error("❌ Template seed error:", err);
  process.exit(1);
});
