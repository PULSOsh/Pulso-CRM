export type BriefingStatus = "Novo" | "Em análise" | "Qualificado" | "Orçamento criado";

export type Briefing = {
  id: string;
  protocol: string;
  name: string;
  company: string;
  service: string;
  status: BriefingStatus;
  submittedAt: string;
  completeness: number;
  budget: string;
  source: string;
};

export const briefings: Briefing[] = [
  {
    id: "b1",
    protocol: "BRF-2026-0042",
    name: "Marina Alves",
    company: "Studio Aura",
    service: "Site Essencial",
    status: "Novo",
    submittedAt: "Hoje, 14:32",
    completeness: 100,
    budget: "R$ 1.200 a R$ 2.500",
    source: "Site da PULSO",
  },
  {
    id: "b2",
    protocol: "BRF-2026-0041",
    name: "Rafael Lima",
    company: "Clínica Horizonte",
    service: "Landing Page",
    status: "Em análise",
    submittedAt: "Hoje, 10:18",
    completeness: 92,
    budget: "Até R$ 2.000",
    source: "Link direto",
  },
  {
    id: "b3",
    protocol: "BRF-2026-0039",
    name: "Bianca Rocha",
    company: "Nexo Consultoria",
    service: "Sistema Web",
    status: "Qualificado",
    submittedAt: "Ontem, 16:46",
    completeness: 100,
    budget: "A definir",
    source: "Instagram",
  },
  {
    id: "b4",
    protocol: "BRF-2026-0036",
    name: "Carlos Mendes",
    company: "Mendes Distribuição",
    service: "Catálogo Digital",
    status: "Orçamento criado",
    submittedAt: "14 jul., 09:05",
    completeness: 88,
    budget: "R$ 600 a R$ 1.000",
    source: "WhatsApp",
  },
];
