import { describe, expect, it } from "vitest";
import {
  availableResult,
  breakEvenRevenue,
  contributionMargin,
  contributionMarginRatio,
  growthTarget,
  minimumHourlyRate,
  minimumTarget,
  operationalResult,
  projectProfitability,
  proportionalGoal,
  runwayMonths,
  safeTarget,
  sustainingCost,
} from "./profitability";

describe("sustainingCost", () => {
  it("sums business fixed cost and personal need", () => {
    expect(sustainingCost(5000, 3000)).toBe(8000);
  });
});

describe("contributionMargin / contributionMarginRatio", () => {
  it("computes margin as revenue minus variable costs", () => {
    expect(contributionMargin(10000, 4000)).toBe(6000);
  });

  it("computes the ratio as margin over revenue", () => {
    expect(contributionMarginRatio(10000, 4000)).toBeCloseTo(0.6);
  });

  it("returns 0 ratio when there is no revenue, never divides by zero", () => {
    expect(contributionMarginRatio(0, 4000)).toBe(0);
  });
});

describe("operationalResult / availableResult", () => {
  it("subtracts fixed cost from margin", () => {
    expect(operationalResult(6000, 5000)).toBe(1000);
  });

  it("subtracts personal need from operational result", () => {
    expect(availableResult(1000, 3000)).toBe(-2000);
  });
});

describe("breakEvenRevenue", () => {
  it("divides fixed cost by the margin ratio", () => {
    expect(breakEvenRevenue(5000, 0.6)).toBeCloseTo(8333.33, 1);
  });

  it("returns null when margin ratio is zero or negative (can't break even)", () => {
    expect(breakEvenRevenue(5000, 0)).toBeNull();
    expect(breakEvenRevenue(5000, -0.1)).toBeNull();
  });
});

describe("minimumTarget / safeTarget / growthTarget", () => {
  it("divides sustaining cost by margin ratio", () => {
    expect(minimumTarget(8000, 0.6)).toBeCloseTo(13333.33, 1);
  });

  it("returns null when margin ratio can't sustain any target", () => {
    expect(minimumTarget(8000, 0)).toBeNull();
  });

  it("safe target is 30% above minimum, growth is 60% above", () => {
    expect(safeTarget(10000)).toBe(13000);
    expect(growthTarget(10000)).toBe(16000);
  });

  it("propagates null through safe/growth when minimum is unreachable", () => {
    expect(safeTarget(null)).toBeNull();
    expect(growthTarget(null)).toBeNull();
  });
});

describe("runwayMonths", () => {
  it("divides cash balance by monthly cost", () => {
    expect(runwayMonths(24000, 8000)).toBe(3);
  });

  it("returns null when monthly cost is zero (infinite runway is not a number)", () => {
    expect(runwayMonths(24000, 0)).toBeNull();
  });
});

describe("minimumHourlyRate", () => {
  it("divides sustaining cost by monthly capacity hours", () => {
    expect(minimumHourlyRate(8000, 160)).toBe(50);
  });

  it("returns null with zero capacity hours", () => {
    expect(minimumHourlyRate(8000, 0)).toBeNull();
  });
});

describe("proportionalGoal", () => {
  it("scales the monthly target by how far through the month we are", () => {
    expect(proportionalGoal(30000, 15, 30)).toBe(15000);
    expect(proportionalGoal(30000, 30, 30)).toBe(30000);
  });

  it("returns 0 for a malformed days-in-month", () => {
    expect(proportionalGoal(30000, 15, 0)).toBe(0);
  });
});

describe("projectProfitability", () => {
  it("subtracts direct costs from revenue", () => {
    expect(projectProfitability(20000, 12000)).toBe(8000);
  });

  it("can be negative when costs exceed revenue", () => {
    expect(projectProfitability(5000, 8000)).toBe(-3000);
  });
});
