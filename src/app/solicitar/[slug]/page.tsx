import { eq } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BriefingWizard } from "@/components/public/briefing-wizard";
import { db } from "@/server/db/connection";
import { briefingTemplates } from "@/server/db/schema";

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

  const sections = [
    {
      id: "sec_1",
      title: "Informações Básicas",
      description: "Conte-nos um pouco sobre você e sua empresa.",
      questions: [
        {
          id: "q_name",
          type: "text",
          title: "Qual o seu nome completo?",
          isRequired: true,
          placeholder: "João Silva",
        },
        {
          id: "q_email",
          type: "email",
          title: "Qual o seu e-mail corporativo?",
          isRequired: true,
          placeholder: "joao@empresa.com",
        },
        {
          id: "q_company",
          type: "text",
          title: "Nome da empresa",
          isRequired: true,
          placeholder: "Sua Empresa LTDA",
        },
      ],
    },
    {
      id: "sec_2",
      title: "Detalhes do Projeto",
      description: "Precisamos entender suas necessidades técnicas.",
      questions: [
        {
          id: "q_desc",
          type: "textarea",
          title: "Descreva brevemente o projeto",
          isRequired: true,
          placeholder: "Gostaríamos de criar um sistema para...",
        },
        {
          id: "q_urgency",
          type: "radio",
          title: "Qual a urgência?",
          isRequired: true,
          options: [
            { label: "Baixa (Exploratório)", value: "low" },
            { label: "Média (Próximos 3 meses)", value: "medium" },
            { label: "Alta (Imediata)", value: "high" },
          ],
        },
        {
          id: "q_features",
          type: "checkbox",
          title: "Quais recursos você considera essenciais?",
          isRequired: false,
          options: [
            { label: "Área de Login", value: "auth" },
            { label: "Pagamentos Online", value: "payments" },
            { label: "Integração com ERP", value: "erp" },
            { label: "Dashboard Administrativo", value: "dashboard" },
          ],
        },
      ],
    },
  ];

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
