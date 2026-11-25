import { getAsset, ASSET_DATABASE } from '../data/assets';

export interface AllocationItem {
  symbol: string;
  weight: number; // 0 to 100
}

export interface BacktestParams {
  allocations: AllocationItem[];
  initialValue: number;
  cashFlowType: 'none' | 'monthly_contribution' | 'annual_contribution' | 'monthly_withdrawal';
  cashFlowAmount: number;
  startYear: number;
  endYear: number;
  rebalancing: 'annually' | 'semi-annually' | 'quarterly' | 'monthly' | 'none';
  benchmark: string;
  riskFreeRate: number; // e.g. 0.04 (4%)
}

export interface YearPerformance {
  year: number;
  startBalance: number;
  portfolioReturn: number;
  deposits: number;
  endBalance: number;
  benchmarkReturn: number;
  benchmarkBalance: number;
}

export interface BacktestResult {
  initialValue: number;
  finalValue: number;
  totalDeposits: number;
  cagr: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  bestYear: { year: number; return: number };
  worstYear: { year: number; return: number };
  benchmarkFinalValue: number;
  benchmarkCagr: number;
  benchmarkMaxDrawdown: number;
  yearHistory: YearPerformance[];
  aiInsights: string;
  allocations: { symbol: string; weight: number; name: string; category: string }[];
}

export function runBacktest(params: BacktestParams): BacktestResult {
  const {
    allocations,
    initialValue,
    cashFlowType,
    cashFlowAmount,
    startYear,
    endYear,
    rebalancing = 'annually',
    benchmark,
    riskFreeRate
  } = params;

  const positiveAllocations = (allocations || [])
    .map(a => ({
      symbol: (a.symbol || '').trim().toUpperCase(),
      weight: Math.max(0, Number(a.weight) || 0)
    }))
    .filter(a => a.symbol.length > 0 && a.weight > 0);

  const totalWeight = positiveAllocations.reduce((sum, a) => sum + a.weight, 0);
  const normalizedAllocations = totalWeight > 0
    ? positiveAllocations.map(a => ({
        symbol: a.symbol,
        weight: (a.weight / totalWeight) * 100
      }))
    : [];

  const detailedAllocations = normalizedAllocations.map(a => {
    const asset = getAsset(a.symbol);
    return {
      symbol: a.symbol,
      weight: a.weight,
      name: asset?.name || a.symbol,
      category: asset?.category || 'Equity'
    };
  });

  if (
    !Number.isFinite(initialValue) ||
    initialValue <= 0 ||
    !Number.isFinite(startYear) ||
    !Number.isFinite(endYear) ||
    startYear > endYear ||
    normalizedAllocations.length === 0 ||
    totalWeight <= 0
  ) {
    const safeInitial = Number.isFinite(initialValue) && initialValue > 0 ? initialValue : 0;
    const safeStartYear = Number.isFinite(startYear) ? startYear : 0;
    const safeEndYear = Number.isFinite(endYear) ? endYear : 0;
    const reason = safeInitial <= 0
      ? 'initial investment must be greater than $0'
      : startYear > endYear
        ? 'start year must precede or equal end year'
        : 'no positive-weight allocations provided';

    return {
      initialValue: safeInitial,
      finalValue: Math.round(safeInitial),
      totalDeposits: Math.round(safeInitial),
      cagr: 0,
      volatility: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      calmarRatio: 0,
      bestYear: { year: safeStartYear, return: 0 },
      worstYear: { year: safeEndYear, return: 0 },
      benchmarkFinalValue: Math.round(safeInitial),
      benchmarkCagr: 0,
      benchmarkMaxDrawdown: 0,
      yearHistory: [],
      aiInsights: `Unable to execute backtest (${reason}). Adjust parameters to compute historical performance.`,
      allocations: detailedAllocations
    };
  }

  const benchmarkAsset = getAsset(benchmark) || getAsset('SPY') || ASSET_DATABASE[1];

  const sleeveBalances = normalizedAllocations.map(a => initialValue * (a.weight / 100));
  let portfolioBalance = initialValue;
  let benchmarkBalance = initialValue;
  let totalDeposits = initialValue;
  let twrTotalFactor = 1;
  let benchmarkTwrFactor = 1;
  let twrEquity = 1;
  let peakTwrEquity = 1;
  let benchmarkTwrEquity = 1;
  let peakBenchmarkTwrEquity = 1;
  let accountDepleted = false;

  const yearHistory: YearPerformance[] = [];
  const returns: number[] = [];
  const benchmarkReturns: number[] = [];
  let maxDrawdown = 0;
  let benchmarkMaxDrawdown = 0;

  const safeCashFlow = Number.isFinite(cashFlowAmount) ? cashFlowAmount : 0;

  // Deterministic zero-mean intra-year seasonal weights for realistic monthly peak-to-trough paths.
  // Sum of weights = 0, so the 12-month compounded product equals the exact annual return.
  // Negative Q1-Q3 dip followed by Q4 partial recovery produces realistic intra-year drawdowns
  // deeper than calendar-year closes.
  const intraYearShape = [-0.4, -0.7, -0.5, 0.1, -0.6, -0.8, 0.2, -0.7, -1.1, 1.3, 1.6, 1.6];

  for (let year = startYear; year <= endYear; year++) {
    const yearStartBalance = sleeveBalances.reduce((sum, b) => sum + b, 0);

    const monthlyFactorsByAsset = normalizedAllocations.map(alloc => {
      const asset = getAsset(alloc.symbol);
      const ret = asset?.annualReturns[year] ?? (asset?.annualReturnMean ? asset.annualReturnMean * 100 : 8.0);
      const annualFactor = 1 + ret / 100;
      if (annualFactor <= 0) return Array(12).fill(0);
      const baseLog = Math.log(annualFactor) / 12;
      const volAmp = (asset?.annualVolatility ?? 0.14) * (ret < 0 ? 0.32 : 0.22);
      return intraYearShape.map(w => Math.exp(baseLog + volAmp * w));
    });

    const bRet = benchmarkAsset?.annualReturns[year] ?? 10.0;
    const bAnnualFactor = 1 + bRet / 100;
    const bMonthlyFactors = bAnnualFactor > 0
      ? intraYearShape.map(w => Math.exp(Math.log(bAnnualFactor) / 12 + (benchmarkAsset?.annualVolatility ?? 0.15) * (bRet < 0 ? 0.32 : 0.22) * w))
      : Array(12).fill(0);

    let yearTwrFactor = 1;
    let yearDeposits = 0;
    let depletedThisYear = false;

    for (let m = 1; m <= 12; m++) {
      const preGrowthTotal = sleeveBalances.reduce((sum, b) => sum + b, 0);
      for (let i = 0; i < sleeveBalances.length; i++) {
        sleeveBalances[i] *= monthlyFactorsByAsset[i][m - 1];
      }
      benchmarkBalance *= bMonthlyFactors[m - 1];

      const postGrowthTotal = sleeveBalances.reduce((sum, b) => sum + b, 0);
      if (preGrowthTotal > 0) {
        const monthFactor = postGrowthTotal / preGrowthTotal;
        yearTwrFactor *= monthFactor;
        twrEquity *= monthFactor;
        if (twrEquity > peakTwrEquity) peakTwrEquity = twrEquity;
        const dd = peakTwrEquity > 0 ? (twrEquity - peakTwrEquity) / peakTwrEquity : 0;
        if (dd < maxDrawdown) maxDrawdown = dd;
      }

      benchmarkTwrEquity *= bMonthlyFactors[m - 1];
      if (benchmarkTwrEquity > peakBenchmarkTwrEquity) peakBenchmarkTwrEquity = benchmarkTwrEquity;
      const bDd = peakBenchmarkTwrEquity > 0 ? (benchmarkTwrEquity - peakBenchmarkTwrEquity) / peakBenchmarkTwrEquity : 0;
      if (bDd < benchmarkMaxDrawdown) benchmarkMaxDrawdown = bDd;

      let mCash = 0;
      if (cashFlowType === 'monthly_contribution') {
        mCash = safeCashFlow;
      } else if (cashFlowType === 'monthly_withdrawal') {
        mCash = -safeCashFlow;
      } else if (cashFlowType === 'annual_contribution' && m === 12) {
        mCash = safeCashFlow;
      }

      if (mCash > 0) {
        for (let i = 0; i < sleeveBalances.length; i++) {
          sleeveBalances[i] += mCash * (normalizedAllocations[i].weight / 100);
        }
        yearDeposits += mCash;
      } else if (mCash < 0) {
        const curTotal = sleeveBalances.reduce((sum, b) => sum + b, 0);
        if (curTotal > 0) {
          const actualWithdrawal = Math.min(curTotal, -mCash);
          yearDeposits -= actualWithdrawal;
          if (curTotal + mCash <= 0) {
            for (let i = 0; i < sleeveBalances.length; i++) {
              sleeveBalances[i] = 0;
            }
            depletedThisYear = true;
            accountDepleted = true;
          } else {
            const scale = (curTotal + mCash) / curTotal;
            for (let i = 0; i < sleeveBalances.length; i++) {
              sleeveBalances[i] *= scale;
            }
          }
        }
      }

      benchmarkBalance = Math.max(0, benchmarkBalance + mCash);

      const shouldRebalance =
        rebalancing === 'monthly' ||
        (rebalancing === 'quarterly' && m % 3 === 0) ||
        (rebalancing === 'semi-annually' && m % 6 === 0) ||
        (rebalancing === 'annually' && m === 12);

      if (shouldRebalance) {
        const total = sleeveBalances.reduce((sum, b) => sum + b, 0);
        for (let i = 0; i < sleeveBalances.length; i++) {
          sleeveBalances[i] = total * (normalizedAllocations[i].weight / 100);
        }
      }
    }

    portfolioBalance = sleeveBalances.reduce((sum, b) => sum + b, 0);
    totalDeposits += yearDeposits;

    const twrYearPct = (yearStartBalance > 0 && portfolioBalance <= 0) || depletedThisYear
      ? -100
      : (yearStartBalance <= 0 && portfolioBalance <= 0)
        ? 0
        : (yearTwrFactor - 1) * 100;

    if (accountDepleted && portfolioBalance <= 0) {
      twrTotalFactor = 0;
      maxDrawdown = -1;
    } else {
      twrTotalFactor *= yearTwrFactor;
    }
    benchmarkTwrFactor *= Math.max(0, bAnnualFactor);

    returns.push(twrYearPct / 100);
    benchmarkReturns.push(bRet / 100);

    yearHistory.push({
      year,
      startBalance: Math.round(yearStartBalance),
      portfolioReturn: Number(twrYearPct.toFixed(2)),
      deposits: Math.round(yearDeposits),
      endBalance: Math.round(portfolioBalance),
      benchmarkReturn: Number(bRet.toFixed(2)),
      benchmarkBalance: Math.round(benchmarkBalance)
    });
  }

  const nYears = Math.max(1, endYear - startYear + 1);

  // Calculate Time-Weighted CAGR: (TWR_Factor)^(1/n) - 1
  const cagr = twrTotalFactor > 0 ? (Math.pow(twrTotalFactor, 1 / nYears) - 1) * 100 : -100;
  const benchmarkCagr = benchmarkTwrFactor > 0 ? (Math.pow(benchmarkTwrFactor, 1 / nYears) - 1) * 100 : -100;

  // Annualized Volatility (Standard Deviation)
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / Math.max(1, returns.length - 1);
  const volatility = Math.sqrt(variance) * 100;

  // Sharpe Ratio = (CAGR - Rf) / Volatility
  const excessReturn = cagr - (riskFreeRate * 100);
  const sharpeRatio = volatility > 0 ? Number((excessReturn / volatility).toFixed(2)) : 0;

  // Sortino Ratio = (CAGR - Rf) / Downside Deviation
  const downsideSquared = returns
    .filter(r => r < riskFreeRate)
    .reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0);
  const downsideDev = Math.sqrt(downsideSquared / Math.max(1, returns.length)) * 100;
  const sortinoRatio = downsideDev > 0 ? Number((excessReturn / downsideDev).toFixed(2)) : Number((sharpeRatio * 1.3).toFixed(2));

  // Calmar Ratio = CAGR / abs(Max Drawdown)
  const absMaxDd = Math.abs(maxDrawdown * 100);
  const calmarRatio = absMaxDd > 0 ? Number((cagr / absMaxDd).toFixed(2)) : 0;

  // Best & Worst Years
  let best = yearHistory[0] ? { year: yearHistory[0].year, return: yearHistory[0].portfolioReturn } : { year: startYear, return: 0 };
  let worst = yearHistory[0] ? { year: yearHistory[0].year, return: yearHistory[0].portfolioReturn } : { year: endYear, return: 0 };
  for (const yh of yearHistory) {
    if (yh.portfolioReturn > best.return) best = { year: yh.year, return: yh.portfolioReturn };
    if (yh.portfolioReturn < worst.return) worst = { year: yh.year, return: yh.portfolioReturn };
  }

  // Generate AI Insights
  const aiInsights = generateInsights({
    cagr,
    volatility,
    sharpeRatio,
    maxDrawdown: absMaxDd,
    benchmarkCagr,
    bestYear: best,
    worstYear: worst,
    allocations: normalizedAllocations
  });

  return {
    initialValue,
    finalValue: Math.round(portfolioBalance),
    totalDeposits: Math.round(totalDeposits),
    cagr: Number(cagr.toFixed(2)),
    volatility: Number(volatility.toFixed(2)),
    sharpeRatio,
    sortinoRatio,
    maxDrawdown: Number((-absMaxDd).toFixed(2)),
    calmarRatio,
    bestYear: best,
    worstYear: worst,
    benchmarkFinalValue: Math.round(benchmarkBalance),
    benchmarkCagr: Number(benchmarkCagr.toFixed(2)),
    benchmarkMaxDrawdown: Number((-Math.abs(benchmarkMaxDrawdown * 100)).toFixed(2)),
    yearHistory,
    aiInsights,
    allocations: detailedAllocations
  };
}

function generateInsights(data: {
  cagr: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  benchmarkCagr: number;
  bestYear: { year: number; return: number };
  worstYear: { year: number; return: number };
  allocations: { symbol: string; weight: number }[];
}): string {
  const outperforming = data.cagr > data.benchmarkCagr;
  const diff = Math.abs(data.cagr - data.benchmarkCagr).toFixed(1);

  let commentary = `Over the analyzed backtest period, your portfolio achieved a **${data.cagr.toFixed(1)}% CAGR** with an annualized volatility of **${data.volatility.toFixed(1)}%**, yielding a Sharpe ratio of **${data.sharpeRatio}**.\n\n`;

  if (outperforming) {
    commentary += `**[ALPHA] Alpha Generation**: The strategy outperformed the benchmark by **+${diff}% annualized**, showing strong compound capital appreciation. Best calendar performance was registered in **${data.bestYear.year} (+${data.bestYear.return}%)**.\n\n`;
  } else {
    commentary += `**[RISK] Risk Profile**: The strategy trailed the equity benchmark by **-${diff}% annualized**, which is characteristic of defensive or diversified multi-asset blends that prioritize capital preservation over pure equity beta.\n\n`;
  }

  if (data.maxDrawdown > 25) {
    commentary += `**[DRAWDOWN] Drawdown Notice**: Maximum peak-to-trough drawdown reached **-${data.maxDrawdown.toFixed(1)}%** (worst year: ${data.worstYear.year} at ${data.worstYear.return}%). Consider integrating low-correlation assets (e.g., intermediate Treasuries or commodities) to smooth downside tail risk.`;
  } else {
    commentary += `**[RESILIENCE] Downside Resiliency**: Max drawdown was well contained at **-${data.maxDrawdown.toFixed(1)}%**, significantly shielding capital during volatile market contractions.`;
  }

  return commentary;
}
