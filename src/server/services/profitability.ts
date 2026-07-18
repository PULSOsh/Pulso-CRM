/**
 * Fórmulas puras do módulo de Custos e lucratividade
 * (docs/MODULE_SPECIFICATIONS.md §13 - "Todas as fórmulas devem ser
 * testadas e documentadas"). Nenhuma função aqui acessa o banco -
 * recebem números já agregados pelas actions e devolvem os indicadores.
 * Isso as torna testáveis sem mock de banco (ver profitability.test.ts).
 *
 * Multiplicadores de meta segura/crescimento (30%/60% acima da meta
 * mínima) são um ponto de partida documentado, não uma fórmula oficial
 * do mercado - ajustar aqui se o fundador validar outro critério.
 */

export function fixedCost(businessFixedExpenses: number): number {
  return businessFixedExpenses;
}

export function personalNeed(personalWithdrawals: number): number {
  return personalWithdrawals;
}

export function sustainingCost(businessFixedCost: number, personalNeedValue: number): number {
  return businessFixedCost + personalNeedValue;
}

export function contributionMargin(receivedRevenue: number, variableCosts: number): number {
  return receivedRevenue - variableCosts;
}

export function contributionMarginRatio(receivedRevenue: number, variableCosts: number): number {
  if (receivedRevenue <= 0) return 0;
  return contributionMargin(receivedRevenue, variableCosts) / receivedRevenue;
}

export function operationalResult(marginValue: number, businessFixedCost: number): number {
  return marginValue - businessFixedCost;
}

export function availableResult(operationalResultValue: number, personalNeedValue: number): number {
  return operationalResultValue - personalNeedValue;
}

export function breakEvenRevenue(businessFixedCost: number, marginRatio: number): number | null {
  if (marginRatio <= 0) return null;
  return businessFixedCost / marginRatio;
}

export function minimumTarget(sustainingCostValue: number, marginRatio: number): number | null {
  if (marginRatio <= 0) return null;
  return sustainingCostValue / marginRatio;
}

export function safeTarget(minimumTargetValue: number | null): number | null {
  if (minimumTargetValue === null) return null;
  return minimumTargetValue * 1.3;
}

export function growthTarget(minimumTargetValue: number | null): number | null {
  if (minimumTargetValue === null) return null;
  return minimumTargetValue * 1.6;
}

export function runwayMonths(cashBalance: number, monthlyCost: number): number | null {
  if (monthlyCost <= 0) return null;
  return cashBalance / monthlyCost;
}

export function minimumHourlyRate(
  sustainingCostValue: number,
  monthlyCapacityHours: number,
): number | null {
  if (monthlyCapacityHours <= 0) return null;
  return sustainingCostValue / monthlyCapacityHours;
}

export function proportionalGoal(
  monthlyTarget: number,
  dayOfMonth: number,
  daysInMonth: number,
): number {
  if (daysInMonth <= 0) return 0;
  return monthlyTarget * (dayOfMonth / daysInMonth);
}

export function projectProfitability(revenue: number, directCosts: number): number {
  return revenue - directCosts;
}
