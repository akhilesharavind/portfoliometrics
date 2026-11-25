export interface MonteCarloParams {
  initialInvestment: number;
  expectedAnnualReturn: number; // e.g. 8.5 (%)
  annualVolatility: number;     // e.g. 15.0 (%)
  annualWithdrawal: number;     // e.g. 40000 ($)
  inflationRate: number;        // e.g. 2.5 (%)
  years: number;                // e.g. 30
  simulationsCount?: number;    // e.g. 1000
}

export interface MonteCarloYearPoint {
  year: number;
  p10: number; // 10th percentile (Pessimistic)
  p25: number;
  p50: number; // Median
  p75: number;
  p90: number; // 90th percentile (Optimistic)
}

export interface MonteCarloResult {
  percentilesByYear: MonteCarloYearPoint[];
  probabilityOfSuccess: number; // % paths where balance > 0
  medianFinalBalance: number;
  p10FinalBalance: number;
  p90FinalBalance: number;
  maxDepletionYear: number | null;
}

export function runMonteCarloSimulation(params: MonteCarloParams): MonteCarloResult {
  const {
    initialInvestment,
    expectedAnnualReturn,
    annualVolatility,
    annualWithdrawal,
    inflationRate,
    years,
    simulationsCount = 1000
  } = params;

  const safeYears = Number.isFinite(years) && years > 0 ? Math.floor(years) : 0;
  const safeInitial = Number.isFinite(initialInvestment) && initialInvestment > 0 ? initialInvestment : 0;

  if (!Number.isFinite(simulationsCount) || simulationsCount < 1) {
    return {
      percentilesByYear: Array.from({ length: safeYears + 1 }, (_, y) => ({
        year: y,
        p10: 0,
        p25: 0,
        p50: 0,
        p75: 0,
        p90: 0
      })),
      probabilityOfSuccess: 0,
      medianFinalBalance: 0,
      p10FinalBalance: 0,
      p90FinalBalance: 0,
      maxDepletionYear: null
    };
  }

  const count = Math.floor(simulationsCount);
  const safeReturn = Number.isFinite(expectedAnnualReturn) ? expectedAnnualReturn : 0;
  const safeVol = Number.isFinite(annualVolatility) && annualVolatility >= 0 ? annualVolatility : 0;
  const safeWithdrawal = Number.isFinite(annualWithdrawal) ? annualWithdrawal : 0;
  const safeInflation = Number.isFinite(inflationRate) ? inflationRate : 0;

  const mu = safeReturn / 100;
  const sigma = safeVol / 100;
  const inflation = safeInflation / 100;

  // Box-Muller transform for normal random numbers
  const randomNormal = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  // Matrix of [simulationIndex][year]
  const paths: number[][] = [];
  let successfulSimulations = 0;
  let maxDepletionYear: number | null = null;

  for (let sim = 0; sim < count; sim++) {
    const path: number[] = [Math.round(safeInitial)];
    let balance = safeInitial;
    let currentWithdrawal = safeWithdrawal;
    let survived = safeInitial > 0;
    let firstDepletionYear: number | null = null;

    for (let y = 1; y <= safeYears; y++) {
      if (balance <= 0) {
        balance = 0;
        survived = false;
        if (firstDepletionYear === null) firstDepletionYear = y;
        path.push(0);
        continue;
      }

      // Geometric Brownian Motion step: St = St-1 * exp((mu - 0.5*sigma^2) + sigma*Z)
      const z = randomNormal();
      const annualReturnFactor = Math.exp((mu - 0.5 * sigma * sigma) + sigma * z);
      balance = balance * annualReturnFactor;

      // Deduct inflation-adjusted withdrawal
      balance -= currentWithdrawal;
      currentWithdrawal *= (1 + inflation);

      if (balance <= 0) {
        balance = 0;
        survived = false;
        if (firstDepletionYear === null) firstDepletionYear = y;
      }
      path.push(Math.round(balance));
    }

    if (survived && balance > 0) {
      successfulSimulations++;
    }
    if (firstDepletionYear !== null && (maxDepletionYear === null || firstDepletionYear > maxDepletionYear)) {
      maxDepletionYear = firstDepletionYear;
    }
    paths.push(path);
  }

  // Calculate percentiles for each year 0..safeYears
  const percentilesByYear: MonteCarloYearPoint[] = [];

  for (let y = 0; y <= safeYears; y++) {
    const valuesAtYear = paths.map(p => p[y]).sort((a, b) => a - b);
    const getPercentile = (pct: number) => {
      const idx = Math.min(valuesAtYear.length - 1, Math.floor((pct / 100) * valuesAtYear.length));
      return valuesAtYear[idx];
    };

    percentilesByYear.push({
      year: y,
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90)
    });
  }

  const finalYear = percentilesByYear[percentilesByYear.length - 1];

  return {
    percentilesByYear,
    probabilityOfSuccess: Number(((successfulSimulations / count) * 100).toFixed(1)),
    medianFinalBalance: finalYear.p50,
    p10FinalBalance: finalYear.p10,
    p90FinalBalance: finalYear.p90,
    maxDepletionYear
  };
}
