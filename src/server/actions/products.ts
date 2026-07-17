"use server";

import crypto from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "../db/connection";
import { products } from "../db/schema";

export async function getProducts(organizationId: string) {
  return await db.query.products.findMany({
    where: eq(products.organizationId, organizationId),
    orderBy: [asc(products.category), asc(products.basePrice)],
  });
}

export async function getProductById(id: string, organizationId: string) {
  return await db.query.products.findFirst({
    where: (p, { and, eq }) => and(eq(p.id, id), eq(p.organizationId, organizationId)),
  });
}

export async function createProduct(data: {
  organizationId: string;
  name: string;
  slug?: string;
  category: string;
  description?: string;
  basePrice: string;
  pricingUnit: string;
  averageDeliveryDays?: number;
  scopeDefault?: string;
  termsDefault?: string;
}) {
  const id = crypto.randomUUID();
  await db.insert(products).values({
    id,
    ...data,
  });

  revalidatePath("/crm/products");
  return { success: true, id };
}

export async function seedProductsFromCatalog(organizationId: string) {
  // Extracted from catalogo.pulsosh.cloud
  const catalog = [
    {
      name: "Link na Bio",
      category: "Entrada rápida",
      basePrice: "197.00",
      pricingUnit: "project",
      averageDeliveryDays: 3,
      description:
        "Uma página no estilo Linktree, mas com a identidade da sua marca, seus contatos e seus links mais importantes.",
    },
    {
      name: "Cartão Digital",
      category: "Entrada rápida",
      basePrice: "297.00",
      pricingUnit: "project",
      averageDeliveryDays: 4,
      description:
        "Um cartão de visita online com contatos, serviços, redes sociais, localização, PIX e botão para salvar seus dados.",
    },
    {
      name: "Catálogo Digital",
      category: "Entrada rápida",
      basePrice: "597.00",
      pricingUnit: "project",
      averageDeliveryDays: 7,
      description:
        "Apresente produtos ou serviços em um catálogo online organizado, compartilhável e pronto para gerar pedidos pelo WhatsApp.",
    },
    {
      name: "Site Essencial",
      category: "Sites",
      basePrice: "1200.00",
      pricingUnit: "project",
      averageDeliveryDays: 12,
      description:
        "Um site profissional de uma página para apresentar sua empresa, serviços, diferenciais e formas de contato.",
    },
    {
      name: "Landing Page",
      category: "Sites",
      basePrice: "1500.00",
      pricingUnit: "project",
      averageDeliveryDays: 15,
      description:
        "Página focada em uma oferta e uma ação, indicada para tráfego pago, lançamentos, eventos e captação de leads.",
    },
    {
      name: "Site Institucional",
      category: "Sites",
      basePrice: "2500.00",
      pricingUnit: "project",
      averageDeliveryDays: 25,
      description:
        "Site com múltiplas páginas para apresentar a empresa, seus serviços, projetos, história e canais de contato.",
    },
    {
      name: "Loja Virtual Starter",
      category: "Sites",
      basePrice: "3500.00",
      pricingUnit: "project",
      averageDeliveryDays: 35,
      description:
        "Estrutura inicial de comércio eletrônico para apresentar produtos, receber pedidos e começar a vender online.",
    },
    {
      name: "Integração com IA",
      category: "Tecnologia",
      basePrice: "2000.00",
      pricingUnit: "project",
      averageDeliveryDays: 20,
      description:
        "Integre inteligência artificial a um site, sistema ou processo para resumir, classificar, gerar ou analisar informações.",
    },
    {
      name: "Automação de Processos",
      category: "Tecnologia",
      basePrice: "3000.00",
      pricingUnit: "project",
      averageDeliveryDays: 25,
      description:
        "Conecte ferramentas e automatize tarefas repetitivas para reduzir erros e liberar tempo da equipe.",
    },
    {
      name: "Sistema Web",
      category: "Tecnologia",
      basePrice: "4500.00",
      pricingUnit: "project",
      averageDeliveryDays: 60,
      description:
        "Sistema personalizado para organizar usuários, dados, processos e regras específicas da sua operação.",
    },
    {
      name: "CRM ou Painel Operacional",
      category: "Tecnologia",
      basePrice: "5000.00",
      pricingUnit: "project",
      averageDeliveryDays: 60,
      description:
        "Centralize leads, clientes, atividades, indicadores e etapas da operação em um ambiente criado para o seu negócio.",
    },
    {
      name: "SaaS ou White Label",
      category: "Tecnologia",
      basePrice: "6000.00",
      pricingUnit: "project",
      averageDeliveryDays: 90,
      description:
        "Construa uma plataforma digital para vender por assinatura ou oferecer aos seus clientes com marca personalizada.",
    },
    {
      name: "Site Assistido",
      category: "Manutenção",
      basePrice: "190.00",
      pricingUnit: "monthly",
      averageDeliveryDays: 0,
      description: "Monitoramento, backup, atualizações e pequenas alterações.",
    },
    {
      name: "Site em Evolução",
      category: "Manutenção",
      basePrice: "390.00",
      pricingUnit: "monthly",
      averageDeliveryDays: 0,
      description: "Manutenção com alterações mensais, novas seções e acompanhamento básico.",
    },
    {
      name: "Sustentação de Sistema",
      category: "Manutenção",
      basePrice: "590.00",
      pricingUnit: "monthly",
      averageDeliveryDays: 0,
      description: "Correções, atualizações essenciais, suporte e pequenos ajustes.",
    },
  ];

  for (const item of catalog) {
    // Upsert or insert if not exists
    const exists = await db.query.products.findFirst({
      where: (p, { and, eq }) => and(eq(p.name, item.name), eq(p.organizationId, organizationId)),
    });

    if (!exists) {
      await db.insert(products).values({
        id: crypto.randomUUID(),
        organizationId,
        name: item.name,
        slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: item.category,
        basePrice: item.basePrice,
        pricingUnit: item.pricingUnit,
        averageDeliveryDays: item.averageDeliveryDays,
        description: item.description,
      });
    }
  }

  revalidatePath("/crm/products");
  return { success: true };
}
