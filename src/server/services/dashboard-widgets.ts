/** CRM-F5-07: catálogo fixo - "configurável" é mostrar/ocultar/ordenar um
 * widget existente, nunca criar uma métrica nova. Cada `key` mapeia direto
 * para uma das 3 seções já existentes em `/crm/relatorios`
 * (reports.ts: getCommercialReport/getOperationalReport/getFinancialReport) -
 * granularidade de seção nesta primeira versão, não de sub-métrica. */
export const DASHBOARD_WIDGET_CATALOG = [
  { key: "commercial_section", label: "Comercial" },
  { key: "operational_section", label: "Operacional" },
  { key: "financial_section", label: "Financeiro" },
] as const;

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_CATALOG)[number]["key"];
