import { getAsset } from '../data/assets';

export interface OptimizationAssetInput {
  symbol: string;
  currentWeight: number;
  minWeight?: number;
  maxWeight?: number;
  annualReturnMean?: number;
  annualVolatility?: number;
}

export interface FrontierPoint {
  volatility: number;
  expectedReturn: number;
  sharpeRatio: number;
  weights: Record<string, number>;
}

export interface OptimizationResult {
  currentPortfolio: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    weights: Record<string, number>;
  };
  maxSharpePortfolio: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    weights: Record<string, number>;
  };
  minVolatilityPortfolio: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    weights: Record<string, number>;
  };
  riskParityPortfolio: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    weights: Record<string, number>;
  };
  efficientFrontier: FrontierPoint[];
  correlationMatrix: {
    symbols: string[];
    matrix: number[][];
  };
  assetMetrics: {
    symbol: string;
    expectedReturn: number;
    volatility: number;
    sharpe: number;
  }[];
}

function projectToBounds(raw: number[], minW: number[], maxW: number[]): number[] {
  const n = raw.length;
  const w = minW.slice();
  let rem = 100 - w.reduce((s, v) => s + v, 0);

  for (let iter = 0; iter < n + 4 && rem > 1e-9; iter++) {
    const unlocked: number[] = [];
    for (let i = 0; i < n; i++) {
      if (w[i] < maxW[i] - 1e-9) {
        unlocked.push(i);
      }
    }
    if (unlocked.length === 0) break;

    const rawSum = unlocked.reduce((s, i) => s + Math.max(0, raw[i]), 0);
    let used = 0;
    for (const i of unlocked) {
      const share = rawSum > 0 ? (Math.max(0, raw[i]) / rawSum) * rem : rem / unlocked.length;
      const avail = maxW[i] - w[i];
      const delta = Math.min(avail, share);
      w[i] += delta;
      used += delta;
    }
    rem -= used;
    if (used <= 1e-12) break;
  }

  return w;
}

function roundWeightsTo100(
  weights: number[],
  symbols: string[],
  minW?: number[],
  maxW?: number[]
): Record<string, number> {
  const n = symbols.length;
  if (n === 0) return {};

  const total = weights.reduce((s, v) => s + Math.max(0, v), 0);
  const scaled = total > 0
    ? weights.map(v => (Math.max(0, v) / total) * 100)
    : symbols.map(() => 100 / n);

  let minTenths = minW
    ? minW.map(m => Math.max(0, Math.min(1000, Math.ceil(m * 10 - 1e-9))))
    : symbols.map(() => 0);
  if (minTenths.reduce((s, v) => s + v, 0) > 1000 && minW) {
    minTenths = minW.map(m => Math.max(0, Math.min(1000, Math.floor(m * 10 + 1e-9))));
  }

  let maxTenths = maxW
    ? maxW.map((m, i) => Math.max(minTenths[i], Math.min(1000, Math.floor(m * 10 + 1e-9))))
    : symbols.map(() => 1000);
  if (maxTenths.reduce((s, v) => s + v, 0) < 1000 && maxW) {
    maxTenths = maxW.map((m, i) => Math.max(minTenths[i], Math.min(1000, Math.ceil(m * 10 - 1e-9))));
  }

  const clamped = scaled.map((v, i) => Math.max(minTenths[i], Math.min(maxTenths[i], v * 10)));
  const floored = clamped.map((c, i) => Math.max(minTenths[i], Math.min(maxTenths[i], Math.floor(c + 1e-9))));
  const remainders = clamped.map((c, i) => c - floored[i]);

  let diff = 1000 - floored.reduce((s, v) => s + v, 0);

  if (diff > 0) {
    const order = symbols
      .map((_, i) => i)
      .sort((a, b) => remainders[b] - remainders[a] || clamped[b] - clamped[a]);
    let guard = 0;
    while (diff > 0 && guard < 10000) {
      let progressed = false;
      for (const i of order) {
        if (diff <= 0) break;
        if (floored[i] < maxTenths[i]) {
          floored[i]++;
          diff--;
          progressed = true;
        }
      }
      if (!progressed) break;
      guard++;
    }
  } else if (diff < 0) {
    const order = symbols
      .map((_, i) => i)
      .sort((a, b) => remainders[a] - remainders[b] || clamped[a] - clamped[b]);
    let guard = 0;
    while (diff < 0 && guard < 10000) {
      let progressed = false;
      for (const i of order) {
        if (diff >= 0) break;
        if (floored[i] > minTenths[i]) {
          floored[i]--;
          diff++;
          progressed = true;
        }
      }
      if (!progressed) break;
      guard++;
    }
  }

  const out: Record<string, number> = {};
  symbols.forEach((sym, i) => {
    out[sym] = Number((floored[i] / 10).toFixed(1));
  });
  return out;
}

export function runOptimization(assets: OptimizationAssetInput[], riskFreeRate: number = 0.04): OptimizationResult {
  const emptyResult: OptimizationResult = {
    currentPortfolio: { expectedReturn: 0, volatility: 0, sharpeRatio: 0, weights: {} },
    maxSharpePortfolio: { expectedReturn: 0, volatility: 0, sharpeRatio: 0, weights: {} },
    minVolatilityPortfolio: { expectedReturn: 0, volatility: 0, sharpeRatio: 0, weights: {} },
    riskParityPortfolio: { expectedReturn: 0, volatility: 0, sharpeRatio: 0, weights: {} },
    efficientFrontier: [],
    correlationMatrix: { symbols: [], matrix: [] },
    assetMetrics: []
  };

  if (!assets || assets.length === 0) {
    return emptyResult;
  }

  // Deduplicate & consolidate symbols
  const consolidatedMap = new Map<string, {
    symbol: string;
    currentWeight: number;
    minWeightSum: number;
    maxWeightSum: number;
    hasMaxWeight: boolean;
    annualReturnMean?: number;
    annualVolatility?: number;
  }>();

  for (const rawAsset of assets) {
    const sym = (rawAsset.symbol || '').trim().toUpperCase();
    if (!sym) continue;
    const cw = Math.max(0, Number(rawAsset.currentWeight) || 0);
    const minWVal = rawAsset.minWeight !== undefined && Number.isFinite(rawAsset.minWeight)
      ? Math.max(0, rawAsset.minWeight)
      : 0;
    const hasMax = rawAsset.maxWeight !== undefined && Number.isFinite(rawAsset.maxWeight);
    const maxWVal = hasMax ? Math.max(0, rawAsset.maxWeight as number) : 100;

    const existing = consolidatedMap.get(sym);
    if (!existing) {
      consolidatedMap.set(sym, {
        symbol: sym,
        currentWeight: cw,
        minWeightSum: minWVal,
        maxWeightSum: maxWVal,
        hasMaxWeight: hasMax,
        annualReturnMean: rawAsset.annualReturnMean,
        annualVolatility: rawAsset.annualVolatility
      });
    } else {
      existing.currentWeight += cw;
      existing.minWeightSum += minWVal;
      if (existing.hasMaxWeight || hasMax) {
        existing.maxWeightSum = (existing.hasMaxWeight ? existing.maxWeightSum : 100) + (hasMax ? maxWVal : 100);
        existing.hasMaxWeight = true;
      }
      if (existing.annualReturnMean === undefined && rawAsset.annualReturnMean !== undefined) {
        existing.annualReturnMean = rawAsset.annualReturnMean;
      }
      if (existing.annualVolatility === undefined && rawAsset.annualVolatility !== undefined) {
        existing.annualVolatility = rawAsset.annualVolatility;
      }
    }
  }

  const consolidated = Array.from(consolidatedMap.values());
  if (consolidated.length === 0) {
    return emptyResult;
  }

  const symbols = consolidated.map(c => c.symbol);
  const n = symbols.length;

  const minW = consolidated.map(c => Math.max(0, Math.min(100, c.minWeightSum)));
  const maxW = consolidated.map((c, i) => Math.max(minW[i], Math.min(100, c.hasMaxWeight ? c.maxWeightSum : 100)));

  const sumMin = minW.reduce((s, v) => s + v, 0);
  if (sumMin > 100) {
    for (let i = 0; i < n; i++) {
      minW[i] = (minW[i] / sumMin) * 100;
      maxW[i] = minW[i];
    }
  }

  const sumMax = maxW.reduce((s, v) => s + v, 0);
  if (sumMax < 100) {
    if (sumMax <= 0) {
      for (let i = 0; i < n; i++) maxW[i] = 100 / n;
    } else {
      for (let i = 0; i < n; i++) maxW[i] = Math.max(minW[i], (maxW[i] / sumMax) * 100);
    }
  }

  const assetData = consolidated.map(item => {
    const a = getAsset(item.symbol);
    const mean = item.annualReturnMean !== undefined && Number.isFinite(item.annualReturnMean)
      ? item.annualReturnMean
      : (a ? a.annualReturnMean : 0.09);
    const vol = item.annualVolatility !== undefined && Number.isFinite(item.annualVolatility)
      ? Math.max(0, item.annualVolatility)
      : (a ? a.annualVolatility : 0.16);
    return {
      symbol: item.symbol,
      mean,
      vol,
      returns: a ? Object.values(a.annualReturns) : [10, -5, 15, 20, -10, 12]
    };
  });

  // Calculate Correlation Matrix
  const correlationMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(1));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const rI = assetData[i].returns;
      const rJ = assetData[j].returns;
      const minLen = Math.min(rI.length, rJ.length);
      const meanI = rI.slice(0, minLen).reduce((a, b) => a + b, 0) / minLen;
      const meanJ = rJ.slice(0, minLen).reduce((a, b) => a + b, 0) / minLen;

      let num = 0;
      let denI = 0;
      let denJ = 0;
      for (let k = 0; k < minLen; k++) {
        const diffI = rI[k] - meanI;
        const diffJ = rJ[k] - meanJ;
        num += diffI * diffJ;
        denI += diffI * diffI;
        denJ += diffJ * diffJ;
      }
      const corr = (denI > 0 && denJ > 0) ? num / Math.sqrt(denI * denJ) : 0.5;
      const roundedCorr = Number(Math.max(-1, Math.min(1, corr)).toFixed(2));
      correlationMatrix[i][j] = roundedCorr;
      correlationMatrix[j][i] = roundedCorr;
    }
  }

  // Helper to compute portfolio return and volatility
  const computeStats = (weightsMap: Record<string, number>) => {
    let ret = 0;
    const w = symbols.map(s => (weightsMap[s] || 0) / 100);

    for (let i = 0; i < n; i++) {
      ret += w[i] * assetData[i].mean;
    }

    let variance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cov = correlationMatrix[i][j] * assetData[i].vol * assetData[j].vol;
        variance += w[i] * w[j] * cov;
      }
    }
    const rawVol = Math.sqrt(Math.max(0, variance));
    const sharpe = rawVol > 1e-9 ? (ret - riskFreeRate) / rawVol : 0;

    return {
      expectedReturn: Number((ret * 100).toFixed(2)),
      volatility: Number((rawVol * 100).toFixed(2)),
      sharpeRatio: Number(sharpe.toFixed(2)),
      weights: weightsMap
    };
  };

  // 1. Current weights
  const rawCurrentWeights = consolidated.map(c => c.currentWeight);
  const currentWeights = roundWeightsTo100(rawCurrentWeights, symbols);
  const currentPortfolio = computeStats(currentWeights);

  // 2. Bounded Simplex Sampling + Deterministic Corner/Seed Candidates
  const samples: FrontierPoint[] = [];
  const pushCandidate = (raw: number[]) => {
    const feasible = projectToBounds(raw, minW, maxW);
    const wMap = roundWeightsTo100(feasible, symbols, minW, maxW);
    const stats = computeStats(wMap);
    samples.push({
      volatility: stats.volatility,
      expectedReturn: stats.expectedReturn,
      sharpeRatio: stats.sharpeRatio,
      weights: wMap
    });
  };

  // Seed feasible current weights, equal weights, and single-asset corner extremes
  pushCandidate(rawCurrentWeights);
  pushCandidate(symbols.map(() => 1));
  for (let i = 0; i < n; i++) {
    pushCandidate(symbols.map((_, j) => (j === i ? 1 : 0)));
  }

  const numSamples = 2000;
  for (let s = 0; s < numSamples; s++) {
    const rawWeights = symbols.map(() => -Math.log(Math.max(1e-9, Math.random())));
    pushCandidate(rawWeights);
  }

  // Find Max Sharpe
  const maxSharpePoint = samples.reduce((best, p) => p.sharpeRatio > best.sharpeRatio ? p : best, samples[0]);
  const maxSharpePortfolio = {
    expectedReturn: maxSharpePoint.expectedReturn,
    volatility: maxSharpePoint.volatility,
    sharpeRatio: maxSharpePoint.sharpeRatio,
    weights: maxSharpePoint.weights
  };

  // Find Min Volatility
  const minVolPoint = samples.reduce((best, p) => p.volatility < best.volatility ? p : best, samples[0]);
  const minVolatilityPortfolio = {
    expectedReturn: minVolPoint.expectedReturn,
    volatility: minVolPoint.volatility,
    sharpeRatio: minVolPoint.sharpeRatio,
    weights: minVolPoint.weights
  };

  // Risk Parity (Equal Risk Contribution approximation: weight ~ 1 / volatility)
  const invVols = assetData.map(a => 1 / Math.max(0.01, a.vol));
  const riskParityWeights = roundWeightsTo100(invVols, symbols);
  const riskParityPortfolio = computeStats(riskParityWeights);

  // Extract efficient frontier upper envelope (sorted by volatility)
  samples.sort(
    (a, b) =>
      a.volatility - b.volatility ||
      b.expectedReturn - a.expectedReturn ||
      b.sharpeRatio - a.sharpeRatio
  );
  const frontierCurve: FrontierPoint[] = [];
  let maxRetSoFar = -Infinity;

  for (const pt of samples) {
    if (
      (frontierCurve.length === 0 || pt.volatility > frontierCurve[frontierCurve.length - 1].volatility) &&
      pt.expectedReturn > maxRetSoFar
    ) {
      frontierCurve.push(pt);
      maxRetSoFar = pt.expectedReturn;
    }
  }

  // Evenly downsample full span to at most 30 points while preserving minVol, maxSharpe, and maxReturn endpoints
  let finalFrontier = frontierCurve;
  if (frontierCurve.length > 30) {
    const L = frontierCurve.length;
    const indices = new Set<number>();
    for (let i = 0; i < 30; i++) {
      indices.add(Math.round((i * (L - 1)) / 29));
    }
    indices.add(0);
    indices.add(L - 1);
    const maxSharpeIdx = frontierCurve.findIndex(
      p => p.volatility === maxSharpePoint.volatility && p.expectedReturn === maxSharpePoint.expectedReturn
    );
    if (maxSharpeIdx !== -1 && !indices.has(maxSharpeIdx)) {
      // Replace nearest interior index to preserve exact <= 30 point count
      let nearest = -1;
      let minDist = Infinity;
      for (const idx of indices) {
        if (idx === 0 || idx === L - 1) continue;
        const d = Math.abs(idx - maxSharpeIdx);
        if (d < minDist) {
          minDist = d;
          nearest = idx;
        }
      }
      if (nearest !== -1) indices.delete(nearest);
      indices.add(maxSharpeIdx);
    }
    const sortedIndices = Array.from(indices).sort((a, b) => a - b);
    finalFrontier = sortedIndices.map(idx => frontierCurve[idx]);
  }

  // Asset level metrics
  const assetMetrics = assetData.map(a => ({
    symbol: a.symbol,
    expectedReturn: Number((a.mean * 100).toFixed(2)),
    volatility: Number((a.vol * 100).toFixed(2)),
    sharpe: a.vol > 0 ? Number(((a.mean - riskFreeRate) / a.vol).toFixed(2)) : 0
  }));

  return {
    currentPortfolio,
    maxSharpePortfolio,
    minVolatilityPortfolio,
    riskParityPortfolio,
    efficientFrontier: finalFrontier,
    correlationMatrix: {
      symbols,
      matrix: correlationMatrix
    },
    assetMetrics
  };
}
