export type StageId = "new" | "qualification" | "diagnosis" | "proposal" | "negotiation" | "won";

export type Opportunity = {
  id: string;
  stage: StageId;
  title: string;
  client: string;
  product: string;
  value: number;
  temperature: "Quente" | "Morna" | "Fria";
  owner: string;
  nextAction: string;
};

export const stages: Array<{ id: StageId; name: string; color: string }> = [
  { id: "new", name: "Novo contato", color: "#7A7A7A" },
  { id: "qualification", name: "Qualificação", color: "#8C6A53" },
  { id: "diagnosis", name: "Diagnóstico", color: "#4169A7" },
  { id: "proposal", name: "Proposta enviada", color: "#B87716" },
  { id: "negotiation", name: "Negociação", color: "#E65318" },
  { id: "won", name: "Fechado", color: "#2E8B57" },
];

export const initialOpportunities: Opportunity[] = [
  {
    id: "1",
    stage: "new",
    title: "Site Essencial para consultório",
    client: "Clínica Sorriso",
    product: "Site Essencial",
    value: 1200,
    temperature: "Quente",
    owner: "Gustavo",
    nextAction: "Responder o contato hoje",
  },
  {
    id: "2",
    stage: "new",
    title: "Catálogo de produtos",
    client: "Casa Flor",
    product: "Catálogo Digital",
    value: 597,
    temperature: "Morna",
    owner: "Ana",
    nextAction: "Enviar exemplos às 16:00",
  },
  {
    id: "3",
    stage: "qualification",
    title: "Página para campanha regional",
    client: "Projeto Sertão Vivo",
    product: "Landing Page",
    value: 1800,
    temperature: "Morna",
    owner: "Gustavo",
    nextAction: "Confirmar orçamento",
  },
  {
    id: "4",
    stage: "diagnosis",
    title: "Automação do atendimento",
    client: "Ótica Central",
    product: "Automação",
    value: 3500,
    temperature: "Quente",
    owner: "Gustavo",
    nextAction: "Mapear fluxo amanhã",
  },
  {
    id: "5",
    stage: "diagnosis",
    title: "Sistema de agendamento interno",
    client: "Clínica Horizonte",
    product: "Sistema Web",
    value: 6800,
    temperature: "Quente",
    owner: "Gustavo",
    nextAction: "Finalizar diagnóstico",
  },
  {
    id: "6",
    stage: "proposal",
    title: "Site institucional completo",
    client: "Grupo Monte Verde",
    product: "Site Institucional",
    value: 3200,
    temperature: "Morna",
    owner: "Gustavo",
    nextAction: "Follow-up amanhã",
  },
  {
    id: "7",
    stage: "proposal",
    title: "Catálogo no WhatsApp",
    client: "Mercado União",
    product: "Catálogo Digital",
    value: 750,
    temperature: "Quente",
    owner: "Ana",
    nextAction: "Retornar proposta",
  },
  {
    id: "8",
    stage: "negotiation",
    title: "CRM personalizado",
    client: "Agência Prisma",
    product: "Sistema Web",
    value: 5400,
    temperature: "Quente",
    owner: "Gustavo",
    nextAction: "Ajustar pagamento",
  },
  {
    id: "9",
    stage: "won",
    title: "Site Essencial contratado",
    client: "Arquitetura Lume",
    product: "Site Essencial",
    value: 1450,
    temperature: "Quente",
    owner: "Gustavo",
    nextAction: "Transformar em projeto",
  },
];
