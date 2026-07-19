import { eq } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BriefingWizard } from "@/components/public/briefing-wizard";
import type { SectionDef } from "@/components/public/question-renderer";
import { db } from "@/server/db/connection";
import { briefingTemplates, briefingTemplateVersions } from "@/server/db/schema";

const FALLBACK_SECTIONS: SectionDef[] = [
  {
    id: "sec_1",
    title: "Informações Básicas",
    description: "Conte-nos um pouco sobre você e sua empresa.",
    questions: [
      {
        id: "q_name",
        type: "text",
        title: "Seu nome",
        isRequired: true,
        placeholder: "Como podemos chamar você?",
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
    ],
  },
  {
    id: "sec_2",
    title: "Sobre o projeto",
    description: "Precisamos entender o que você imagina.",
    questions: [
      {
        id: "q_description",
        type: "textarea",
        title: "Descreva o que você imagina",
        isRequired: true,
        placeholder: "O que você precisa para o seu negócio?",
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
];

export default async function BriefingPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Find published template by slug
  const template = await db.query.briefingTemplates.findFirst({
    where: eq(briefingTemplates.slug, slug),
  });

  if (template?.status !== "published") {
    notFound();
  }

  // O formulário é dirigido pelo snapshot da versão publicada (json com
  // seções/perguntas) - se o template ainda não tiver uma versão publicada
  // (dado nunca semeado), cai num formulário genérico em vez de quebrar.
  const version = template.publishedVersionId
    ? await db.query.briefingTemplateVersions.findFirst({
        where: eq(briefingTemplateVersions.id, template.publishedVersionId),
        columns: { snapshot: true },
      })
    : null;

  const snapshotSections = (version?.snapshot as { sections?: SectionDef[] } | undefined)?.sections;
  const sections =
    snapshotSections && snapshotSections.length > 0 ? snapshotSections : FALLBACK_SECTIONS;

  return (
    <div className="public-briefing-layout">
      <aside className="public-briefing-brand">
        <Image
          src="/brand/pulso_horizontal_signal_white.svg"
          alt="PULSO"
          width={132}
          height={36}
          priority
        />
        <div>
          <p className="eyebrow eyebrow-light">
            BRIEFING · {template.publicTitle?.toUpperCase() ?? "PULSO"}
          </p>
          <h1>Vamos entender antes de construir.</h1>
          <p>
            {template.publicDescription ||
              "Suas respostas ajudam a PULSO a recomendar o produto, o escopo e o investimento mais coerentes para o seu momento."}
          </p>
        </div>
        <p className="privacy-note">
          <ShieldCheck size={20} />
          Seus dados são usados apenas para analisar e responder esta solicitação.
        </p>
      </aside>

      <BriefingWizard templateId={template.id} templateSlug={template.slug} sections={sections} />
    </div>
  );
}
