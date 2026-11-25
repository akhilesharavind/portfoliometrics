import { runBacktest, BacktestResult, AllocationItem } from './backtestingEngine';
import { runOptimization, OptimizationAssetInput } from './optimizationEngine';
import { runMonteCarloSimulation } from './monteCarloEngine';
import { calculateCagr, calculateCompoundInterest } from './calculatorEngine';
import { POPULAR_PORTFOLIOS } from '../data/popularPortfolios';
import { getAsset, ASSET_DATABASE } from '../data/assets';
import { ChatMessagePart } from '../components/generative/types';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  parts?: ChatMessagePart[];
  backtestData?: BacktestResult;
  suggestedPrompt?: string;
}

export interface ProcessAiQueryResult {
  text: string;
  backtestData?: BacktestResult;
  parts: ChatMessagePart[];
}

function normalizeAllocationsTo100(items: AllocationItem[]): AllocationItem[] {
  const valid = items.filter(a => a.weight > 0);
  if (valid.length === 0) return [];
  const total = valid.reduce((s, a) => s + a.weight, 0);
  if (total <= 0) return [];

  const tenths = valid.map(a => Math.floor((a.weight / total) * 1000 + 1e-9));
  const remainders = valid.map((a, i) => (a.weight / total) * 1000 - tenths[i]);
  let diff = 1000 - tenths.reduce((s, v) => s + v, 0);
  const order = valid.map((_, i) => i).sort((a, b) => remainders[b] - remainders[a]);
  for (let k = 0; k < order.length && diff > 0; k++) {
    tenths[order[k]]++;
    diff--;
  }
  return valid.map((a, i) => ({
    symbol: a.symbol,
    weight: Number((tenths[i] / 10).toFixed(1))
  }));
}

export function parseCustomAllocations(prompt: string): AllocationItem[] | null {
  const withPercent = /(\d+(?:\.\d+)?)\s*%\s*([A-Za-z]{2,5}(?:-[A-Za-z]{2,4})?)|([A-Za-z]{2,5}(?:-[A-Za-z]{2,4})?)\s*[:=(]?\s*(\d+(?:\.\d+)?)\s*%/g;
  const withoutPercent = /\b(\d{1,3}(?:\.\d+)?)\s+([A-Z]{2,5})\b|\b([A-Z]{2,5})\s*[:=]?\s*(\d{1,3}(?:\.\d+)?)\b/gi;
  const merged = new Map<string, number>();

  for (const match of prompt.matchAll(withPercent)) {
    const rawWeight = match[1] ?? match[4];
    const rawSym = match[2] ?? match[3];
    if (!rawWeight || !rawSym) continue;
    const asset = getAsset(rawSym);
    if (!asset) continue;
    const w = parseFloat(rawWeight);
    if (!Number.isFinite(w) || w <= 0) continue;
    merged.set(asset.symbol, (merged.get(asset.symbol) || 0) + w);
  }

  if (merged.size === 0) {
    for (const match of prompt.matchAll(withoutPercent)) {
      const rawWeight = match[1] ?? match[4];
      const rawSym = match[2] ?? match[3];
      if (!rawWeight || !rawSym) continue;
      const asset = getAsset(rawSym);
      if (!asset) continue;
      const w = parseFloat(rawWeight);
      if (!Number.isFinite(w) || w <= 0) continue;
      merged.set(asset.symbol, (merged.get(asset.symbol) || 0) + w);
    }
  }

  if (merged.size === 0) return null;
  const items = Array.from(merged.entries()).map(([symbol, weight]) => ({ symbol, weight }));
  const normalized = normalizeAllocationsTo100(items);
  return normalized.length > 0 ? normalized : null;
}

export function parseDollarAmounts(prompt: string): number[] {
  const amounts: number[] = [];
  const regex = /\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:([kmb])(?![a-z]))?/gi;
  for (const match of prompt.matchAll(regex)) {
    const base = parseFloat(match[1].replace(/,/g, ''));
    if (!Number.isFinite(base) || base < 0) continue;
    const suffix = (match[2] || '').toLowerCase();
    const mult = suffix === 'k' ? 1e3 : suffix === 'm' ? 1e6 : suffix === 'b' ? 1e9 : 1;
    amounts.push(base * mult);
  }
  return amounts;
}

export function parseYears(prompt: string, fallback: number): number {
  const match = prompt.match(/(\d+(?:\.\d+)?)\s*(?:-|\s)?(?:years?|yrs?)\b/i);
  if (!match) return fallback;
  const val = parseFloat(match[1]);
  return Number.isFinite(val) && val > 0 && val <= 100 ? val : fallback;
}

export function parseRatePercent(prompt: string, fallback: number): number {
  const scoped = prompt.match(/(?:at|return|rate|interest|yield)\s*(?:of)?\s*(-?\d+(?:\.\d+)?)\s*%/i);
  if (scoped) {
    const val = parseFloat(scoped[1]);
    if (Number.isFinite(val)) return val;
  }
  const standalone = prompt.match(/(-?\d+(?:\.\d+)?)\s*%(?!\s*(?:withdrawal|rule))/i);
  if (standalone) {
    const val = parseFloat(standalone[1]);
    if (Number.isFinite(val)) return val;
  }
  return fallback;
}

function parseSingleDollarToken(rawNum: string, suffix?: string): number {
  const base = parseFloat(rawNum.replace(/,/g, ''));
  const s = (suffix || '').toLowerCase();
  const mult = s === 'k' ? 1e3 : s === 'm' ? 1e6 : s === 'b' ? 1e9 : 1;
  return base * mult;
}

function extractMentionedSymbols(prompt: string): string[] {
  const found: string[] = [];
  for (const asset of ASSET_DATABASE) {
    const escaped = asset.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'i');
    if (re.test(prompt)) {
      found.push(asset.symbol);
    }
  }
  return found;
}

function formatWeightList(weights: Record<string, number>): string {
  return Object.entries(weights)
    .filter(([, w]) => w > 0)
    .map(([sym, w]) => `${sym} ${w}%`)
    .join(', ');
}

export function processAiQuery(
  prompt: string,
  workspaceAllocations?: AllocationItem[]
): ProcessAiQueryResult {
  const p = prompt.toLowerCase();
  const validWorkspace = (workspaceAllocations || [])
    .map(a => {
      const asset = getAsset(a.symbol);
      return asset && a.weight > 0 ? { symbol: asset.symbol, weight: a.weight } : null;
    })
    .filter((x): x is AllocationItem => x !== null);

  // Priority 1: Explicit custom asset allocations (e.g. "60% QQQ, 40% TLT")
  const customAlloc = parseCustomAllocations(prompt);
  if (customAlloc && customAlloc.length >= 1) {
    const dollars = parseDollarAmounts(prompt);
    const initialValue = dollars[0] && dollars[0] > 0 ? dollars[0] : 10000;
    const res = runBacktest({
      allocations: customAlloc,
      initialValue,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2014,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    const allocSummary = customAlloc.map(a => `${a.weight}% ${a.symbol}`).join(', ');
    let text = `### Custom Allocation Backtest & Telemetry\n\n` +
      `Backtesting **${allocSummary}** from **2014 to 2025** on an initial **$${initialValue.toLocaleString('en-US')}** investment.\n\n` +
      `- **Final Balance**: **$${res.finalValue.toLocaleString('en-US')}** (vs **$${res.benchmarkFinalValue.toLocaleString('en-US')}** S&P 500)\n` +
      `- **Annualized CAGR**: **${res.cagr}%** (Benchmark: ${res.benchmarkCagr}%)\n` +
      `- **Annualized Volatility**: **${res.volatility}%**\n` +
      `- **Sharpe Ratio**: **${res.sharpeRatio}**\n` +
      `- **Max Drawdown**: **${res.maxDrawdown}%**\n`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'backtest_scenario',
        payload: {
          title: 'Custom Allocation Backtest',
          allocations: customAlloc,
          initialValue,
          startYear: 2014,
          endYear: 2025,
          benchmark: 'SPY'
        }
      }
    ];

    if (
      (p.includes('sharpe') || p.includes('optimize') || p.includes('frontier') || p.includes('mpt')) &&
      customAlloc.length >= 2
    ) {
      const optInputs: OptimizationAssetInput[] = customAlloc.map(a => ({
        symbol: a.symbol,
        currentWeight: a.weight
      }));
      const opt = runOptimization(optInputs, 0.04);
      text += `\n**Markowitz Optimization Overlay:**\n` +
        `- **Max Sharpe Portfolio**: ${opt.maxSharpePortfolio.expectedReturn}% return, ${opt.maxSharpePortfolio.volatility}% vol (Sharpe ${opt.maxSharpePortfolio.sharpeRatio}) :  ${formatWeightList(opt.maxSharpePortfolio.weights)}\n` +
        `- **Min Volatility Portfolio**: ${opt.minVolatilityPortfolio.expectedReturn}% return, ${opt.minVolatilityPortfolio.volatility}% vol (Sharpe ${opt.minVolatilityPortfolio.sharpeRatio}) :  ${formatWeightList(opt.minVolatilityPortfolio.weights)}\n`;
      parts[0] = { type: 'text', content: text };
      parts.push({
        type: 'widget',
        widgetType: 'mpt_frontier',
        payload: {
          title: 'Custom Allocation Efficient Frontier',
          symbols: customAlloc.map(a => a.symbol),
          riskFreeRate: 0.04
        }
      });
    }

    return { text, backtestData: res, parts };
  }

  // Priority 2: CAGR intent (checked BEFORE 'growth' Tech Titans and 'compound')
  if (
    /\bcagr\b/i.test(p) ||
    p.includes('compound annual growth rate') ||
    p.includes('annualized growth') ||
    p.includes('double capital') ||
    p.includes('growth rate') ||
    (p.includes('target') && !p.includes('retirement') && !p.includes('withdrawal') && !p.includes('monte carlo'))
  ) {
    const isDouble = p.includes('double');
    const years = parseYears(prompt, isDouble ? 7 : 10);
    const dollars = parseDollarAmounts(prompt);
    let initialValue = 10000;
    let finalValue = 50000;

    if (dollars.length >= 2) {
      initialValue = dollars[0];
      finalValue = dollars[1];
    } else if (isDouble) {
      initialValue = dollars.length === 1 ? dollars[0] : 10000;
      finalValue = initialValue * 2;
    } else if (dollars.length === 1) {
      initialValue = dollars[0];
      finalValue = dollars[0] * 2;
    }

    const cagrRes = calculateCagr({ initialValue, finalValue, years });
    const gainStr = cagrRes.totalGain < 0
      ? `-$${Math.abs(cagrRes.totalGain).toLocaleString('en-US')}`
      : `$${cagrRes.totalGain.toLocaleString('en-US')}`;
    const multiple = initialValue > 0 ? (finalValue / initialValue).toFixed(2) : '0.00';

    const text = `### Compound Annual Growth Rate (CAGR) Analysis\n\n` +
      `Evaluating capital appreciation required to move from **$${initialValue.toLocaleString('en-US')}** to **$${finalValue.toLocaleString('en-US')}** over a **${years}-year** investment period.\n\n` +
      `- **Target Multiple**: **${multiple}x** initial capital\n` +
      `- **Required CAGR**: **${cagrRes.cagr}%** annualized geometric mean\n` +
      `- **Total Net Gain**: **${gainStr}** (**${cagrRes.totalReturnPercent}%** total return)\n\n` +
      `*Strategic Verdict*: Adjust starting capital, ending target, or horizon below to inspect annual compounding milestones.`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'cagr_projection',
        payload: {
          title: 'Target CAGR Progression',
          initialValue,
          finalValue,
          years
        }
      }
    ];

    const res = runBacktest({
      allocations: validWorkspace.length > 0 ? validWorkspace : [{ symbol: 'SPY', weight: 100 }],
      initialValue: initialValue > 0 ? initialValue : 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    return { text, backtestData: res, parts };
  }

  // Priority 3: Ray Dalio / All Weather
  if (p.includes('all weather') || p.includes('all-weather') || p.includes('dalio')) {
    const portfolio = POPULAR_PORTFOLIOS.find(x => x.id === 'all-weather')!;
    const allocations: AllocationItem[] = portfolio.allocations.map(a => ({ symbol: a.symbol, weight: a.weight }));
    const res = runBacktest({
      allocations,
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2012,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    const drawdownComparison = Math.abs(res.maxDrawdown) <= Math.abs(res.benchmarkMaxDrawdown)
      ? `contained downside at **${res.maxDrawdown}%** compared to **${res.benchmarkMaxDrawdown}%** for S&P 500`
      : `experienced a deeper peak-to-trough drawdown (**${res.maxDrawdown}%**) than S&P 500 (**${res.benchmarkMaxDrawdown}%**) due to long-duration bond sensitivity during rate hikes`;

    const text = `### Ray Dalio All Weather Strategy Analysis\n\n` +
      `The **All-Weather Strategy** is built upon Risk Parity principles across equities, long/intermediate Treasuries, gold, and real estate.\n\n` +
      `**Key Findings (2012 - 2025):**\n` +
      `- **CAGR**: **${res.cagr}%** vs **${res.benchmarkCagr}%** (S&P 500)\n` +
      `- **Volatility**: **${res.volatility}%**\n` +
      `- **Sharpe Ratio**: **${res.sharpeRatio}**\n` +
      `- **Max Drawdown**: **${res.maxDrawdown}%** (versus ${res.benchmarkMaxDrawdown}% for S&P 500)\n\n` +
      `**Asset Allocation:**\n` +
      allocations.map(a => `- **${a.symbol}**: **${a.weight}%**`).join('\n') +
      `\n\n*Strategic Verdict*: Over the 2012 - 2025 window, this allocation ${drawdownComparison}.`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'backtest_scenario',
        payload: {
          title: 'Ray Dalio All-Weather Strategy',
          allocations,
          initialValue: 10000,
          startYear: 2012,
          endYear: 2025,
          benchmark: 'SPY'
        }
      },
      {
        type: 'widget',
        widgetType: 'mpt_frontier',
        payload: {
          title: 'All-Weather Asset Universe Frontier',
          symbols: allocations.map(a => a.symbol),
          riskFreeRate: 0.04
        }
      }
    ];

    return { text, backtestData: res, parts };
  }

  // Priority 4: MPT / Optimization / Efficient Frontier / Risk Parity
  if (
    p.includes('mpt') ||
    p.includes('efficient frontier') ||
    p.includes('frontier') ||
    p.includes('markowitz') ||
    p.includes('max sharpe') ||
    p.includes('min vol') ||
    p.includes('minimum volatility') ||
    p.includes('risk parity') ||
    p.includes('optimize')
  ) {
    const mentioned = extractMentionedSymbols(prompt);
    const workspaceSyms = validWorkspace.map(a => a.symbol);
    const baseUniverse = workspaceSyms.length >= 2 ? workspaceSyms : ['VTI', 'VXUS', 'BND'];
    const mergedSet = new Set<string>([...baseUniverse, ...mentioned]);
    if (mergedSet.size < 2) {
      for (const s of ['VTI', 'VXUS', 'BND', 'GLD', 'VNQ']) mergedSet.add(s);
    } else if (mentioned.length === 0 && workspaceSyms.length === 0) {
      mergedSet.add('GLD');
      mergedSet.add('VNQ');
    }
    const symbols = Array.from(mergedSet).slice(0, 6);

    const workspaceWeightMap = new Map(validWorkspace.map(a => [a.symbol, a.weight]));
    const inputs: OptimizationAssetInput[] = symbols.map(sym => ({
      symbol: sym,
      currentWeight: workspaceWeightMap.get(sym) ?? Number((100 / symbols.length).toFixed(1))
    }));

    const opt = runOptimization(inputs, 0.04);

    const text = `### Markowitz Efficient Frontier & Portfolio Optimization\n\n` +
      `Computed 2,000+ constrained simplex allocations across **${symbols.join(', ')}** (risk-free rate **4.0%**).\n\n` +
      `| Strategy | Expected Return | Volatility | Sharpe | Target Weights |\n` +
      `|---|---|---|---|---|\n` +
      `| **Max Sharpe** | ${opt.maxSharpePortfolio.expectedReturn}% | ${opt.maxSharpePortfolio.volatility}% | ${opt.maxSharpePortfolio.sharpeRatio} | ${formatWeightList(opt.maxSharpePortfolio.weights)} |\n` +
      `| **Min Volatility** | ${opt.minVolatilityPortfolio.expectedReturn}% | ${opt.minVolatilityPortfolio.volatility}% | ${opt.minVolatilityPortfolio.sharpeRatio} | ${formatWeightList(opt.minVolatilityPortfolio.weights)} |\n` +
      `| **Risk Parity** | ${opt.riskParityPortfolio.expectedReturn}% | ${opt.riskParityPortfolio.volatility}% | ${opt.riskParityPortfolio.sharpeRatio} | ${formatWeightList(opt.riskParityPortfolio.weights)} |\n\n` +
      `*Strategic Verdict*: Select assets or apply the Max Sharpe allocation directly from the interactive frontier studio below.`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'mpt_frontier',
        payload: {
          title: 'Markowitz Efficient Frontier Analysis',
          symbols,
          riskFreeRate: 0.04
        }
      }
    ];

    const maxSharpeAllocs: AllocationItem[] = Object.entries(opt.maxSharpePortfolio.weights)
      .filter(([, w]) => w > 0)
      .map(([symbol, weight]) => ({ symbol, weight }));
    const res = runBacktest({
      allocations: maxSharpeAllocs.length > 0 ? maxSharpeAllocs : [{ symbol: 'VTI', weight: 60 }, { symbol: 'BND', weight: 40 }],
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    return { text, backtestData: res, parts };
  }

  // Priority 5: Retirement / Monte Carlo / Sequence of Returns
  if (
    p.includes('retirement') ||
    p.includes('monte carlo') ||
    p.includes('withdrawal') ||
    p.includes('nest egg') ||
    p.includes('sequence of returns')
  ) {
    const withdrawalMatch = prompt.match(/\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:([kmb])(?![a-z]))?(?=\s*(?:annual|yearly|\/yr|per year|withdrawal|withdraw))/i);
    const portfolioMatch = prompt.match(/(?:on|portfolio|nest egg|initial|starting)\s*(?:of)?\s*\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:([kmb])(?![a-z]))?/i);
    const dollars = parseDollarAmounts(prompt);

    let initialInvestment = 500000;
    let annualWithdrawal = 20000;

    if (portfolioMatch && withdrawalMatch) {
      initialInvestment = parseSingleDollarToken(portfolioMatch[1], portfolioMatch[2]);
      annualWithdrawal = parseSingleDollarToken(withdrawalMatch[1], withdrawalMatch[2]);
    } else if (dollars.length >= 2) {
      const sortedDesc = [...dollars].sort((a, b) => b - a);
      initialInvestment = portfolioMatch ? parseSingleDollarToken(portfolioMatch[1], portfolioMatch[2]) : sortedDesc[0];
      annualWithdrawal = withdrawalMatch ? parseSingleDollarToken(withdrawalMatch[1], withdrawalMatch[2]) : sortedDesc[1];
    } else if (dollars.length === 1) {
      if (withdrawalMatch) {
        annualWithdrawal = parseSingleDollarToken(withdrawalMatch[1], withdrawalMatch[2]);
      } else {
        initialInvestment = dollars[0];
        annualWithdrawal = Math.round(initialInvestment * 0.04);
      }
    }

    const years = parseYears(prompt, 25);
    const expectedAnnualReturn = parseRatePercent(prompt, 7.5);
    const annualVolatility = 15.0;
    const inflationRate = 2.5;

    const mc = runMonteCarloSimulation({
      initialInvestment,
      expectedAnnualReturn,
      annualVolatility,
      annualWithdrawal,
      inflationRate,
      years,
      simulationsCount: 1000
    });

    const swrPct = initialInvestment > 0 ? ((annualWithdrawal / initialInvestment) * 100).toFixed(1) : '0.0';

    const text = `### Retirement Wealth Preservation Simulation\n\n` +
      `Modeling a **$${initialInvestment.toLocaleString('en-US')}** portfolio with **$${annualWithdrawal.toLocaleString('en-US')}/year** inflation-adjusted withdrawals (**${swrPct}%** initial withdrawal rate) over a **${years}-year** horizon.\n\n` +
      `- **Probability of Survival**: **${mc.probabilityOfSuccess}%** across 1,000 Box-Muller paths\n` +
      `- **Median Final Balance (P50)**: **$${mc.medianFinalBalance.toLocaleString('en-US')}**\n` +
      `- **Downside Tail (P10)**: **$${mc.p10FinalBalance.toLocaleString('en-US')}**\n` +
      `- **Upside Tail (P90)**: **$${mc.p90FinalBalance.toLocaleString('en-US')}**\n` +
      `- **Assumed Return / Volatility / Inflation**: ${expectedAnnualReturn}% / ${annualVolatility}% / ${inflationRate}%\n\n` +
      `*Strategic Verdict*: Stress-test withdrawal rate and return assumptions below to quantify sequence-of-returns risk.`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'monte_carlo_fan',
        payload: {
          title: 'Retirement Wealth Preservation Fan',
          initialInvestment,
          expectedAnnualReturn,
          annualVolatility,
          annualWithdrawal,
          years
        }
      }
    ];

    const res = runBacktest({
      allocations: validWorkspace.length > 0 ? validWorkspace : [{ symbol: 'VTI', weight: 60 }, { symbol: 'BND', weight: 40 }],
      initialValue: initialInvestment > 0 ? initialInvestment : 500000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    return { text, backtestData: res, parts };
  }

  // Priority 6: Compound Interest / Savings (skip if user asked for a specific allocation like 60/40)
  if ((p.includes('compound') || p.includes('savings') || p.includes('monthly deposit')) && !p.includes('60/40') && !p.includes('classic') && !p.includes('balanced')) {
    const monthlyMatch = prompt.match(/\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:([kmb])(?![a-z]))?(?=\s*(?:\/\s*mo|\/\s*month|per month|monthly|deposit|contribution))/i);
    const initialMatch = prompt.match(/(?:initial|starting|start|principal|with)\s*(?:investment|deposit|of)?\s*\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:([kmb])(?![a-z]))?/i);
    const dollars = parseDollarAmounts(prompt);

    let initialInvestment = 10000;
    let monthlyContribution = 500;

    if (monthlyMatch) {
      monthlyContribution = parseSingleDollarToken(monthlyMatch[1], monthlyMatch[2]);
      if (initialMatch) {
        const initCandidate = parseSingleDollarToken(initialMatch[1], initialMatch[2]);
        if (initCandidate !== monthlyContribution || dollars.length >= 2) {
          initialInvestment = initCandidate;
        }
      } else {
        const other = dollars.find(d => d !== monthlyContribution);
        if (other !== undefined) initialInvestment = other;
      }
    } else if (dollars.length >= 2) {
      initialInvestment = dollars[0];
      monthlyContribution = dollars[1];
    } else if (dollars.length === 1) {
      initialInvestment = dollars[0];
    }

    const annualInterestRate = parseRatePercent(prompt, 7.0);
    const years = parseYears(prompt, 15);
    const compoundingFrequency: 1 | 2 | 4 | 12 | 365 = p.includes('daily')
      ? 365
      : p.includes('quarterly')
        ? 4
        : (p.includes('semi-annual') || p.includes('semiannual'))
          ? 2
          : p.includes('annual')
            ? 1
            : 12;

    const ci = calculateCompoundInterest({
      initialInvestment,
      monthlyContribution,
      annualInterestRate,
      years,
      compoundingFrequency
    });

    let comparisonNote = '';
    if (p.includes('daily') && p.includes('monthly')) {
      const dailyRes = calculateCompoundInterest({
        initialInvestment,
        monthlyContribution,
        annualInterestRate,
        years,
        compoundingFrequency: 365
      });
      const monthlyRes = calculateCompoundInterest({
        initialInvestment,
        monthlyContribution,
        annualInterestRate,
        years,
        compoundingFrequency: 12
      });
      const diff = dailyRes.finalBalance - monthlyRes.finalBalance;
      comparisonNote = `- **Daily vs Monthly Compounding**: Daily (**$${dailyRes.finalBalance.toLocaleString('en-US')}**) vs Monthly (**$${monthlyRes.finalBalance.toLocaleString('en-US')}**), a difference of **$${diff.toLocaleString('en-US')}** over ${years} years\n`;
    }

    const freqLabel = compoundingFrequency === 365
      ? 'Daily'
      : compoundingFrequency === 12
        ? 'Monthly'
        : compoundingFrequency === 4
          ? 'Quarterly'
          : compoundingFrequency === 2
            ? 'Semi-Annual'
            : 'Annual';

    const text = `### Long-Term Compound Growth Projection\n\n` +
      `Modeling an initial investment of **$${initialInvestment.toLocaleString('en-US')}** with **$${monthlyContribution.toLocaleString('en-US')}/month** contributions at **${annualInterestRate}%** nominal annual return (${freqLabel} compounding over **${years} years**).\n\n` +
      `- **Projected Final Balance**: **$${ci.finalBalance.toLocaleString('en-US')}**\n` +
      `- **Total Principal Contributed**: **$${ci.totalPrincipal.toLocaleString('en-US')}**\n` +
      `- **Total Interest Earned**: **$${ci.totalInterest.toLocaleString('en-US')}**\n` +
      comparisonNote +
      `\n*Strategic Verdict*: Adjust contribution cadence, compounding frequency, and horizon below to evaluate accumulation sensitivity.`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'compound_growth',
        payload: {
          title: `${freqLabel} Savings Compounding Model`,
          initialInvestment,
          monthlyContribution,
          annualInterestRate,
          years,
          compoundingFrequency
        }
      }
    ];

    const res = runBacktest({
      allocations: validWorkspace.length > 0 ? validWorkspace : [{ symbol: 'VTI', weight: 80 }, { symbol: 'BND', weight: 20 }],
      initialValue: initialInvestment > 0 ? initialInvestment : 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    return { text, backtestData: res, parts };
  }

  // Priority 7: Preset strategies & Drawdown scenarios
  // 7a. 60/40 Portfolio
  if (p.includes('60/40') || p.includes('classic') || p.includes('balanced')) {
    const portfolio = POPULAR_PORTFOLIOS.find(x => x.id === 'classic-60-40')!;
    const allocations: AllocationItem[] = portfolio.allocations.map(a => ({ symbol: a.symbol, weight: a.weight }));
    const depositMatch = prompt.match(/\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:monthly|per month|\/mo|deposit)/i);
    const hasMonthlyDeposit = p.includes('monthly') || p.includes('deposit');
    const monthlyDeposit = hasMonthlyDeposit && depositMatch ? parseFloat(depositMatch[1].replace(/,/g, '')) : 0;
    const res = runBacktest({
      allocations,
      initialValue: 10000,
      cashFlowType: monthlyDeposit > 0 ? 'monthly_contribution' : 'none',
      cashFlowAmount: monthlyDeposit,
      startYear: 2012,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    const cashFlowNote = monthlyDeposit > 0
      ? ` with **$${monthlyDeposit.toLocaleString('en-US')}/month** recurring deposits`
      : '';

    const text = `### Classic 60/40 Balanced Portfolio\n\n` +
      `The benchmark institutional allocation combining **60% US Total Stock Market (VTI)** and **40% Total Bond Market (BND)**${cashFlowNote}.\n\n` +
      `**Performance Summary:**\n` +
      `- **Ending Balance**: **$${res.finalValue.toLocaleString('en-US')}** (Total deposited: $${res.totalDeposits.toLocaleString('en-US')})\n` +
      `- **CAGR (TWR)**: **${res.cagr}%**\n` +
      `- **Sharpe Ratio**: **${res.sharpeRatio}**\n` +
      `- **Max Drawdown**: **${res.maxDrawdown}%**\n\n` +
      `*Strategic Verdict*: Provides reliable diversification, though during correlated inflationary shocks (such as 2022), both bonds and equities can experience concurrent drawdowns.`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'backtest_scenario',
        payload: {
          title: 'Classic 60/40 Balanced Strategy',
          allocations,
          initialValue: 10000,
          startYear: 2012,
          endYear: 2025,
          benchmark: 'SPY'
        }
      }
    ];

    return { text, backtestData: res, parts };
  }

  // 7b. Tech / Growth / QQQ
  if (p.includes('tech') || p.includes('qqq') || p.includes('growth') || p.includes('nvidia') || p.includes('apple')) {
    const portfolio = POPULAR_PORTFOLIOS.find(x => x.id === 'tech-titans')!;
    const allocations: AllocationItem[] = portfolio.allocations.map(a => ({ symbol: a.symbol, weight: a.weight }));
    const res = runBacktest({
      allocations,
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2015,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    const text = `### High-Conviction Tech & Growth Strategy\n\n` +
      `A growth-tilted portfolio composed of **QQQ (40%)**, **NVDA (20%)**, **MSFT (20%)**, and **AAPL (20%)**.\n\n` +
      `**Performance Summary (2015 - 2025):**\n` +
      `- **Compound Growth**: $10,000 grew to **$${res.finalValue.toLocaleString('en-US')}**\n` +
      `- **CAGR**: **${res.cagr}%** vs **${res.benchmarkCagr}%** (S&P 500)\n` +
      `- **Sharpe Ratio**: **${res.sharpeRatio}**\n` +
      `- **Max Drawdown**: **${res.maxDrawdown}%**\n\n` +
      `*Strategic Verdict*: High capital appreciation accompanied by elevated volatility. Investors must be prepared for severe drawdowns during tech sector multiple contractions.`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'backtest_scenario',
        payload: {
          title: 'High-Conviction Tech & Growth Strategy',
          allocations,
          initialValue: 10000,
          startYear: 2015,
          endYear: 2025,
          benchmark: 'SPY'
        }
      }
    ];

    return { text, backtestData: res, parts };
  }

  // 7c. Dividend Aristocrats / Income
  if (p.includes('dividend') || p.includes('schd') || p.includes('income')) {
    const portfolio = POPULAR_PORTFOLIOS.find(x => x.id === 'dividend-aristocrats')!;
    const allocations: AllocationItem[] = portfolio.allocations.map(a => ({ symbol: a.symbol, weight: a.weight }));
    const res = runBacktest({
      allocations,
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2014,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    const blendedYield = 0.0304; // 50% SCHD (3.6%) + 30% SPY (1.4%) + 20% VNQ (4.1%)
    const incomeSample = res.yearHistory.slice(-5).map(y => {
      const estIncome = Math.round(y.endBalance * blendedYield);
      return `| ${y.year} | $${y.endBalance.toLocaleString('en-US')} | $${estIncome.toLocaleString('en-US')}/yr | $${Math.round(estIncome / 12).toLocaleString('en-US')}/mo |`;
    }).join('\n');

    const text = `### Dividend Growth & Cash Flow Portfolio\n\n` +
      `Focused on sustained dividend compounding through **SCHD (50%, ~3.6% yield)**, **SPY (30%, ~1.4% yield)**, and **VNQ (20%, ~4.1% yield)** for a blended **3.04% portfolio yield**.\n\n` +
      `**Performance Summary:**\n` +
      `- **CAGR**: **${res.cagr}%**\n` +
      `- **Sharpe Ratio**: **${res.sharpeRatio}**\n` +
      `- **Max Drawdown**: **${res.maxDrawdown}%**\n` +
      `- **Final Balance**: **$${res.finalValue.toLocaleString('en-US')}**\n\n` +
      `**Estimated Annual Dividend Cash Flow (Trailing 5 Years):**\n` +
      `| Year | Portfolio Balance | Est. Annual Dividend | Est. Monthly Income |\n` +
      `|---|---|---|---|\n` +
      `${incomeSample}\n\n` +
      `*Strategic Verdict*: Consistent risk-adjusted cash flow with growing annual dividend income.`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'backtest_scenario',
        payload: {
          title: 'Dividend Aristocrats Portfolio',
          allocations,
          initialValue: 10000,
          startYear: 2014,
          endYear: 2025,
          benchmark: 'SPY'
        }
      }
    ];

    return { text, backtestData: res, parts };
  }

  // 7d. 2022 / Drawdown Stress-Test
  if (p.includes('2022') || p.includes('drawdown')) {
    const targetAlloc = validWorkspace.length > 0
      ? validWorkspace
      : [{ symbol: 'VTI', weight: 60 }, { symbol: 'BND', weight: 40 }];
    const res = runBacktest({
      allocations: targetAlloc,
      initialValue: 10000,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear: 2018,
      endYear: 2025,
      rebalancing: 'annually',
      benchmark: 'SPY',
      riskFreeRate: 0.04
    });

    const y2022 = res.yearHistory.find(y => y.year === 2022);
    const allocDesc = res.allocations.map(a => `${a.weight.toFixed(0)}% ${a.symbol}`).join(', ');

    const text = `### Drawdown & 2022 Rate-Shock Stress Test\n\n` +
      `Evaluating **${allocDesc}** across the **2018 - 2025** cycle including the 2022 correlated equity/bond drawdown.\n\n` +
      `- **2022 Calendar Return**: **${y2022 ? `${y2022.portfolioReturn}%` : 'N/A'}** (S&P 500: ${y2022 ? `${y2022.benchmarkReturn}%` : '-18.2%'})\n` +
      `- **Maximum Peak-to-Trough Drawdown**: **${res.maxDrawdown}%** (Benchmark: ${res.benchmarkMaxDrawdown}%)\n` +
      `- **Period CAGR**: **${res.cagr}%** | **Sharpe Ratio**: **${res.sharpeRatio}**\n` +
      `- **Ending Value**: **$${res.finalValue.toLocaleString('en-US')}** from $10,000\n\n` +
      `*Strategic Verdict*: Adjust asset sleeves below to test alternative hedges during tightening regimes.`;

    const parts: ChatMessagePart[] = [
      { type: 'text', content: text },
      {
        type: 'widget',
        widgetType: 'backtest_scenario',
        payload: {
          title: 'Drawdown Stress Test (2018-2025)',
          allocations: targetAlloc,
          initialValue: 10000,
          startYear: 2018,
          endYear: 2025,
          benchmark: 'SPY'
        }
      }
    ];

    return { text, backtestData: res, parts };
  }

  // Priority 8: Workspace-aware query or explicit "not understood" response
  const useWorkspace =
    validWorkspace.length > 0 &&
    (p.includes('workspace') || p.includes('active') || p.includes('current'));

  if (!useWorkspace) {
    const supportedTickers = ASSET_DATABASE.map(a => a.symbol).join(', ');
    const hasPercentOrNumber = /\d+\s*%/.test(prompt);
    const hasZeroWeight = /\b0\s*%?\s*[A-Za-z]{2,5}\b/.test(prompt);
    const reason = hasZeroWeight
      ? 'All provided allocation weights are 0%. Provide positive percentages summing above 0%.'
      : hasPercentOrNumber
        ? 'One or more requested tickers are not in the supported historical asset database.'
        : 'Input was not recognized as a portfolio allocation, optimization, Monte Carlo, compound interest, or CAGR query.';

    const text = `### Query Not Understood\n\n` +
      `${reason}\n\n` +
      `**Supported Examples:**\n` +
      `- Custom backtest: \`60% VTI, 40% BND\` or \`60 VTI 40 BND\`\n` +
      `- Optimization: \`Optimize efficient frontier for VTI, VXUS, BND, GLD\`\n` +
      `- Retirement simulation: \`Monte Carlo $1,000,000 portfolio with $40,000 annual withdrawal for 30 years\`\n` +
      `- Calculators: \`Compound interest $10,000 with $500/mo at 7% for 20 years\` or \`CAGR from $10,000 to $35,000 over 10 years\`\n\n` +
      `**Supported Tickers:** ${supportedTickers}`;

    return {
      text,
      parts: [{ type: 'text', content: text }]
    };
  }

  const targetAllocations: AllocationItem[] = validWorkspace;
  const res = runBacktest({
    allocations: targetAllocations,
    initialValue: 10000,
    cashFlowType: 'none',
    cashFlowAmount: 0,
    startYear: 2014,
    endYear: 2025,
    rebalancing: 'annually',
    benchmark: 'SPY',
    riskFreeRate: 0.04
  });

  const allocLabel = targetAllocations.map(a => `${a.weight}% ${a.symbol}`).join(', ');
  const text = `### Active Workspace Strategy Analysis\n\n` +
    `Analyzing workspace strategy: **${allocLabel}** over **2014 - 2025**.\n\n` +
    `- **Final Portfolio Value**: **$${res.finalValue.toLocaleString('en-US')}** (from $10,000 initial investment)\n` +
    `- **Annualized Return (CAGR)**: **${res.cagr}%**\n` +
    `- **Risk-Adjusted Sharpe Ratio**: **${res.sharpeRatio}**\n` +
    `- **Max Drawdown**: **${res.maxDrawdown}%**\n\n` +
    `*Strategic Insight*: Customize allocations directly in the interactive backtest widget below.`;

  const parts: ChatMessagePart[] = [
    { type: 'text', content: text },
    {
      type: 'widget',
      widgetType: 'backtest_scenario',
      payload: {
        title: 'Active Workspace Strategy',
        allocations: targetAllocations,
        initialValue: 10000,
        startYear: 2014,
        endYear: 2025,
        benchmark: 'SPY'
      }
    }
  ];

  return { text, backtestData: res, parts };
}
