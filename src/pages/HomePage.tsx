import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  MessageSquare,
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { LineChart } from '../components/SimpleChart';
import { runBacktest } from '../services/backtestingEngine';

interface HomePageProps {
  onSelectTab: (tab: string, initialPrompt?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectTab }) => {
  const [prompt, setPrompt] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const promptSuggestions = [
    'Ray Dalio All-Weather vs S&P 500',
    'Classic 60/40 with 500 monthly deposit',
    'Tech Titans growth strategy',
    'Dividend Aristocrats cash flow'
  ];

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      onSelectTab('backtesting');
      return;
    }
    onSelectTab('ai-assistant', prompt);
  };

  // Live telemetry data computed from historical backtest engine (60% VTI / 40% BND, 2015-2025)
  const heroBacktest = useMemo(
    () =>
      runBacktest({
        allocations: [
          { symbol: 'VTI', weight: 60 },
          { symbol: 'BND', weight: 40 }
        ],
        initialValue: 10000,
        startYear: 2015,
        endYear: 2025,
        benchmark: 'SPY',
        rebalancing: 'annually',
        cashFlowAmount: 0,
        cashFlowType: 'none',
        riskFreeRate: 0.04
      }),
    []
  );

  const heroPreviewChart = useMemo(
    () => [
      { label: '2014', value: 10000, benchmark: 10000 },
      ...heroBacktest.yearHistory.map((y) => ({
        label: String(y.year),
        value: y.endBalance,
        benchmark: y.benchmarkBalance
      }))
    ],
    [heroBacktest]
  );

  const heroNetGrowthPct = ((heroBacktest.finalValue / heroBacktest.initialValue - 1) * 100).toFixed(0);

  const faqs = [
    {
      q: 'What is portfolio backtesting?',
      a: 'Backtesting models an asset allocation strategy against historical market return sequences, accounting for rebalancing intervals, dividend reinvestment, and cash flows to evaluate risk-adjusted performance across market cycles.'
    },
    {
      q: 'What data sources and assets are supported?',
      a: 'The engine covers 13 multi-asset instruments: US equities (VTI, SPY, QQQ, SCHD, AAPL, MSFT, NVDA), international equities (VXUS), Treasury and total market bonds (TLT, BND), gold (GLD), real estate (VNQ), and Bitcoin (BTC-USD) across empirical annual returns from 2010 to 2025 (2015-2025 for BTC-USD).'
    },
    {
      q: 'How does Modern Portfolio Theory (MPT) optimization work?',
      a: 'The optimizer computes the historical covariance matrix across your asset universe and calculates the Markowitz Efficient Frontier to isolate allocations with the highest Sharpe ratio or minimum historical variance.'
    },
    {
      q: 'How does Monte Carlo simulation estimate retirement risk?',
      a: 'The engine generates 1,000 geometric Brownian motion paths under specified annual volatility and expected return, calculating the empirical survival rate under inflation-adjusted periodic withdrawals.'
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      
      {/* Hero Section */}
      <section className="pt-12 px-6 max-w-6xl mx-auto space-y-6">
        
        {/* Crox-style Editorial Metadata Spec Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-black/[0.08] dark:border-white/[0.08] text-[11px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
          <div className="flex items-center gap-3">
            <span className="text-primary font-medium tracking-wider">[LAB: QUANTITATIVE STUDIO]</span>
            <span className="opacity-30">/</span>
            <span>US &amp; GLOBAL INDEX SERIES</span>
            <span className="opacity-30">/</span>
            <span>SERIES: 2010-2025</span>
          </div>
          <div className="flex items-center gap-2 text-graphite-lightSecondary dark:text-graphite-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
            <span>ZERO-LATENCY CLIENT RUNTIME (0 MS)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
          
          {/* Left Column: Headline and Context */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-graphite-lightText dark:text-graphite-text leading-[1.08]">
              We engineer portfolio models serious investors rely on.
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-graphite-lightSecondary dark:text-graphite-secondary max-w-lg">
              Historical return distributions, covariance matrices, Markowitz frontiers and Monte Carlo paths modeled across 16 years of multi-asset market history (2010-2025).
            </p>

            {/* Prompt Form */}
            <form onSubmit={handlePromptSubmit} className="pt-2">
              <label htmlFor="homepage-strategy-prompt" className="sr-only">
                Ask a portfolio question or compare allocations
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
                <span className="pl-2 font-mono text-[11px] text-primary select-none font-semibold">&gt;</span>
                <input
                  id="homepage-strategy-prompt"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask a strategy question or specify asset weights..."
                  className="w-full px-2 py-2 text-xs text-graphite-lightText dark:text-graphite-text bg-transparent placeholder-graphite-lightMuted dark:placeholder-graphite-muted focus:outline-none"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-[6px] shrink-0 transition-colors shadow-sm"
                >
                  Simulate Strategy
                </button>
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-[11px] font-mono text-graphite-lightMuted dark:text-graphite-muted mr-1">[PRESETS]:</span>
                {promptSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectTab('ai-assistant', s)}
                    className="min-h-[44px] inline-flex items-center text-[11px] font-mono px-3 py-2 rounded-md bg-white dark:bg-graphite-card text-graphite-lightSecondary dark:text-graphite-secondary border border-black/[0.08] dark:border-white/[0.08] hover:text-graphite-lightText dark:hover:text-graphite-text hover:border-primary/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onSelectTab('backtesting')}
                className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-md transition-all shadow-sm"
              >
                Launch Backtest Engine
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('popular-portfolios')}
                className="min-h-[44px] inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text border border-black/[0.08] dark:border-white/[0.08] rounded-md transition-colors"
              >
                Inspect Classic Portfolios
              </button>
            </div>
          </div>

          {/* Right Column: Hero Product Moment (Coded Preview of real backtest) */}
          <div className="lg:col-span-6">
            <div className="rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-sm space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-lightMuted dark:text-graphite-muted">TELEMETRY: STRATEGY BENCHMARK</span>
                  </div>
                  <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">Classic 60/40 · 60% VTI / 40% BND (2015-2025)</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-medium text-primary tabular">${heroBacktest.finalValue.toLocaleString()}</div>
                  <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted tabular">{Number(heroNetGrowthPct) >= 0 ? '+' : ''}{heroNetGrowthPct}% net growth</div>
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-4 gap-2 text-center py-1">
                <div className="p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.03]">
                  <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">CAGR</div>
                  <div className="text-xs font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular">{heroBacktest.cagr.toFixed(1)}%</div>
                </div>
                <div className="p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.03]">
                  <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Volatility</div>
                  <div className="text-xs font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular">{heroBacktest.volatility.toFixed(1)}%</div>
                </div>
                <div className="p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.03]">
                  <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Sharpe</div>
                  <div className="text-xs font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular">{Number.isFinite(heroBacktest.sharpeRatio) ? heroBacktest.sharpeRatio.toFixed(2) : 'N/A'}</div>
                </div>
                <div className="p-2 rounded-md bg-black/[0.02] dark:bg-white/[0.03]">
                  <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Max DD</div>
                  <div className="text-xs font-mono font-medium text-semantic-negativeLight dark:text-semantic-negative tabular">{heroBacktest.maxDrawdown.toFixed(1)}%</div>
                </div>
              </div>

              {/* Chart */}
              <div>
                <LineChart data={heroPreviewChart} height={200} valuePrefix="$" />
              </div>

              {/* Allocation bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mb-1.5">
                  <span>Equities 60%</span>
                  <span>Fixed Income 40%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-black/[0.06] dark:bg-white/[0.06]">
                  <div className="h-full bg-primary" style={{ width: '60%' }}></div>
                  <div className="h-full bg-graphite-lightMuted dark:bg-graphite-muted" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Section 01: Facts / Empirical Tolerances */}
      <section className="max-w-6xl mx-auto px-6 space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
          <span className="text-primary font-semibold">01</span>
          <span>/</span>
          <span>EMPIRICAL TOLERANCES</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] text-center">
          <div className="p-3 rounded-lg bg-black/[0.015] dark:bg-white/[0.02]">
            <div className="text-2xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular">16 YRS</div>
            <div className="text-xs text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Empirical market series (2010-2025)</div>
          </div>
          <div className="p-3 rounded-lg bg-black/[0.015] dark:bg-white/[0.02]">
            <div className="text-2xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular">13 ASSETS</div>
            <div className="text-xs text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Global equities, debt &amp; commodities</div>
          </div>
          <div className="p-3 rounded-lg bg-black/[0.015] dark:bg-white/[0.02]">
            <div className="text-2xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular">1,000</div>
            <div className="text-xs text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Monte Carlo stochastic paths</div>
          </div>
          <div className="p-3 rounded-lg bg-black/[0.015] dark:bg-white/[0.02]">
            <div className="text-2xl font-mono font-medium text-primary tabular">0 ms</div>
            <div className="text-xs text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Local in-browser client execution</div>
          </div>
        </div>
      </section>

      {/* Section 02: Quantitative Analysis Tools */}
      <section className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
              <span className="text-primary font-semibold">02</span>
              <span>/</span>
              <span>INSTRUMENT CAPABILITIES</span>
            </div>
            <h2 className="text-2xl font-medium tracking-tight text-graphite-lightText dark:text-graphite-text mt-1">
              Precision quantitative modules
            </h2>
          </div>
          <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary max-w-sm">
            Engineered for strategy validation, correlation discovery, and retirement survivability.
          </p>
        </div>

        {/* Varied Visual Rhythm: 2 Featured Quantitative Cards + 2 Compact Tool Cards */}
        <div className="space-y-5">
          
          {/* Top Row: Featured Quantitative Engines */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Featured Engine 1: Backtesting (7 cols) */}
            <button 
              type="button"
              onClick={() => onSelectTab('backtesting')}
              className="lg:col-span-7 w-full text-left p-6 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] hover:border-primary/50 transition-colors flex flex-col justify-between space-y-4 focus-visible:ring-2 focus-visible:ring-primary group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-center text-graphite-lightText dark:text-graphite-text">
                      <BarChart3 aria-hidden="true" className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tracking-wider">[SYS.01]</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-medium tracking-wide">
                    16-YR HISTORICAL REPLAY
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-medium text-graphite-lightText dark:text-graphite-text group-hover:text-primary transition-colors">
                    Portfolio Backtesting Engine
                  </h3>
                  <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary mt-1.5 leading-relaxed max-w-xl">
                    Rebalancing intervals, periodic cash flows, benchmark tracking, and drawdown analysis across 16 years of empirical market returns (2010-2025).
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2.5 rounded bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono uppercase">Coverage</div>
                    <div className="text-xs font-mono font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">13 Asset Series</div>
                  </div>
                  <div className="p-2.5 rounded bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono uppercase">Rebalancing</div>
                    <div className="text-xs font-mono font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">Annual / Qtr / Mo</div>
                  </div>
                  <div className="p-2.5 rounded bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono uppercase">Metrology</div>
                    <div className="text-xs font-mono font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">Sharpe / Calmar / DD</div>
                  </div>
                </div>
              </div>

              <div className="text-xs font-medium text-primary pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                Configure backtest
              </div>
            </button>

            {/* Featured Engine 2: Optimization (5 cols) */}
            <button 
              type="button"
              onClick={() => onSelectTab('optimization')}
              className="lg:col-span-5 w-full text-left p-6 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] hover:border-primary/50 transition-colors flex flex-col justify-between space-y-4 focus-visible:ring-2 focus-visible:ring-primary group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-center text-graphite-lightText dark:text-graphite-text">
                      <TrendingUp aria-hidden="true" className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tracking-wider">[SYS.02]</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.05] text-graphite-lightSecondary dark:text-graphite-secondary font-medium tracking-wide">
                    QUADRATIC COVARIANCE
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-medium text-graphite-lightText dark:text-graphite-text group-hover:text-primary transition-colors">
                    MPT Frontier &amp; Optimization
                  </h3>
                  <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary mt-1.5 leading-relaxed">
                    Markowitz efficient frontier, max Sharpe ratio tangency portfolio, and pairwise covariance matrix modeling.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono uppercase">Tangency</div>
                    <div className="text-xs font-mono font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">Max Sharpe Ratio</div>
                  </div>
                  <div className="p-2.5 rounded bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono uppercase">Variance Floor</div>
                    <div className="text-xs font-mono font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">Min Volatility</div>
                  </div>
                </div>
              </div>

              <div className="text-xs font-medium text-primary pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                View frontier
              </div>
            </button>

          </div>

          {/* Bottom Row: Compact Tool Instruments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Compact Tool 1: Monte Carlo */}
            <button 
              type="button"
              onClick={() => onSelectTab('monte-carlo')}
              className="w-full text-left p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] hover:border-primary/50 transition-colors flex items-start justify-between gap-4 focus-visible:ring-2 focus-visible:ring-primary group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-center text-graphite-lightText dark:text-graphite-text shrink-0">
                    <Activity aria-hidden="true" className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-graphite-lightText dark:text-graphite-text group-hover:text-primary transition-colors">
                        Monte Carlo Risk Engine
                      </h3>
                      <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">[SYS.03]</span>
                    </div>
                    <div className="text-[11px] font-mono text-graphite-lightMuted dark:text-graphite-muted mt-0.5">
                      1,000 paths · Inflation-adjusted withdrawals
                    </div>
                  </div>
                </div>
                <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary leading-relaxed pl-10">
                  Stochastic geometric Brownian motion modeling empirical survival probabilities under decumulation schedules.
                </p>
                <div className="pl-10 pt-1 text-xs font-medium text-primary">
                  Run simulation
                </div>
              </div>
            </button>

            {/* Compact Tool 2: AI Assistant */}
            <button 
              type="button"
              onClick={() => onSelectTab('ai-assistant')}
              className="w-full text-left p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] hover:border-primary/50 transition-colors flex items-start justify-between gap-4 focus-visible:ring-2 focus-visible:ring-primary group"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-center text-graphite-lightText dark:text-graphite-text shrink-0">
                    <MessageSquare aria-hidden="true" className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-graphite-lightText dark:text-graphite-text group-hover:text-primary transition-colors">
                        AI Quantitative Assistant
                      </h3>
                      <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">[SYS.04]</span>
                    </div>
                    <div className="text-[11px] font-mono text-graphite-lightMuted dark:text-graphite-muted mt-0.5">
                      Natural language · Direct backtest synthesis
                    </div>
                  </div>
                </div>
                <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary leading-relaxed pl-10">
                  Quantitative assistant that parses natural language strategy queries directly into verified portfolio parameters.
                </p>
                <div className="pl-10 pt-1 text-xs font-medium text-primary">
                  Start session
                </div>
              </div>
            </button>

          </div>

        </div>
      </section>

      {/* Section 03: Comparison Table */}
      <section className="max-w-6xl mx-auto px-6 space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
          <span className="text-primary font-semibold">03</span>
          <span>/</span>
          <span>BENCHMARK SPECIFICATIONS</span>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <h2 className="text-base font-medium text-graphite-lightText dark:text-graphite-text mb-1">
            Platform specification matrix
          </h2>
          <p className="text-xs text-graphite-lightMuted dark:text-graphite-muted mb-6">
            Feature availability across standard quantitative portfolio modeling architectures.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black/[0.08] dark:border-white/[0.08] text-graphite-lightMuted dark:text-graphite-muted">
                  <th className="py-2.5 px-3 font-medium">Capability</th>
                  <th className="py-2.5 px-3 font-medium text-primary">PortfolioMetrics</th>
                  <th className="py-2.5 px-3 font-medium">Portfolio Visualizer</th>
                  <th className="py-2.5 px-3 font-medium">Curvo / Testfolio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-graphite-lightSecondary dark:text-graphite-secondary">
                <tr>
                  <td className="py-2.5 px-3">Full historical backtesting</td>
                  <td className="py-2.5 px-3 text-primary font-medium">Included</td>
                  <td className="py-2.5 px-3">Tier restricted</td>
                  <td className="py-2.5 px-3">Limited assets</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Markowitz efficient frontier</td>
                  <td className="py-2.5 px-3 text-primary font-medium">Included</td>
                  <td className="py-2.5 px-3">Paid tier</td>
                  <td className="py-2.5 px-3">Not available</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Monte Carlo survival modeling</td>
                  <td className="py-2.5 px-3 text-primary font-medium">1,000 paths</td>
                  <td className="py-2.5 px-3">Paid tier</td>
                  <td className="py-2.5 px-3">Basic</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Natural language query engine</td>
                  <td className="py-2.5 px-3 text-primary font-medium">Included</td>
                  <td className="py-2.5 px-3">Not available</td>
                  <td className="py-2.5 px-3">Not available</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3">Local execution / zero tracking</td>
                  <td className="py-2.5 px-3 text-primary font-medium">Client-side (0 ms)</td>
                  <td className="py-2.5 px-3">Server-side</td>
                  <td className="py-2.5 px-3">Server-side</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 04: Notes from the Lab (FAQ Accordions) */}
      <section className="max-w-4xl mx-auto px-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
            <span className="text-primary font-semibold">04</span>
            <span>/</span>
            <span>NOTES FROM THE LAB</span>
          </div>
          <h2 className="text-xl font-medium text-graphite-lightText dark:text-graphite-text mt-1">
            Methodology and mathematical foundations
          </h2>
          <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary mt-0.5">
            How we calculate returns, risk boundaries, and stochastic paths: written by quantitative developers.
          </p>
        </div>

        <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06] border-y border-black/[0.06] dark:border-white/[0.06]">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-1.5">
              <button
                type="button"
                aria-expanded={expandedFaq === idx}
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full min-h-[44px] flex items-center justify-between text-left text-xs font-medium text-graphite-lightText dark:text-graphite-text focus-visible:ring-2 focus-visible:ring-primary rounded py-2 px-1 group"
              >
                <span className="group-hover:text-primary transition-colors">{faq.q}</span>
                {expandedFaq === idx ? (
                  <ChevronUp aria-hidden="true" className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <ChevronDown aria-hidden="true" className="w-3.5 h-3.5 opacity-50 shrink-0" />
                )}
              </button>
              {expandedFaq === idx && (
                <p className="mt-2 text-xs leading-relaxed text-graphite-lightSecondary dark:text-graphite-secondary pl-1">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
