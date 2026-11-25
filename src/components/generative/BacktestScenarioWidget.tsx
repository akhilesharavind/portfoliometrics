import React, { useState, useMemo, useEffect, useRef, useId } from 'react';
import { runBacktest, BacktestResult, AllocationItem } from '../../services/backtestingEngine';
import { LineChart, DonutChart } from '../SimpleChart';
import { GenerativeWidgetProps, WidgetPayloadMap } from './types';
import { useOptionalStudioContext } from '../../context/StudioContext';
import { Sliders, ExternalLink, Check, RefreshCw } from 'lucide-react';

const DEFAULT_ALLOCATIONS: AllocationItem[] = [
  { symbol: 'VTI', weight: 60 },
  { symbol: 'BND', weight: 40 }
];

export const BacktestScenarioWidget: React.FC<GenerativeWidgetProps<WidgetPayloadMap['backtest_scenario']>> = ({
  payload,
  onApplyToWorkspace,
  onNavigateTab
}) => {
  const uid = useId();
  const [allocations, setAllocations] = useState<AllocationItem[]>(() =>
    Array.isArray(payload?.allocations) && payload.allocations.length > 0
      ? payload.allocations.map(a => ({ ...a }))
      : DEFAULT_ALLOCATIONS
  );
  const studio = useOptionalStudioContext();
  const [initialValue, setInitialValue] = useState<number>(payload?.initialValue ?? 10000);
  const [startYear, setStartYear] = useState<number>(payload?.startYear ?? 2014);
  const [endYear, setEndYear] = useState<number>(payload?.endYear ?? 2025);
  const [benchmark, setBenchmark] = useState<string>(payload?.benchmark ?? 'SPY');
  const [applied, setApplied] = useState<boolean>(false);

  const payloadKey = JSON.stringify({
    allocations: payload?.allocations,
    initialValue: payload?.initialValue,
    startYear: payload?.startYear,
    endYear: payload?.endYear,
    benchmark: payload?.benchmark
  });
  const prevPayloadKeyRef = useRef<string>(payloadKey);

  useEffect(() => {
    if (payloadKey !== prevPayloadKeyRef.current) {
      prevPayloadKeyRef.current = payloadKey;
      if (Array.isArray(payload?.allocations) && payload.allocations.length > 0) {
        setAllocations(payload.allocations.map(a => ({ ...a })));
      }
      if (payload?.initialValue !== undefined) setInitialValue(payload.initialValue);
      if (payload?.startYear !== undefined) setStartYear(payload.startYear);
      if (payload?.endYear !== undefined) setEndYear(payload.endYear);
      if (payload?.benchmark !== undefined) setBenchmark(payload.benchmark);
    }
  }, [payloadKey, payload]);

  // Compute total allocation
  const totalWeight = allocations.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);

  // Live real-time backtest recalculation
  const result: BacktestResult = useMemo(() => {
    return runBacktest({
      allocations,
      initialValue,
      cashFlowType: 'none',
      cashFlowAmount: 0,
      startYear,
      endYear,
      rebalancing: 'annually',
      benchmark,
      riskFreeRate: 0.04
    });
  }, [allocations, initialValue, startYear, endYear, benchmark]);

  const handleWeightChange = (index: number, newWeight: number) => {
    const next = [...allocations];
    next[index] = { ...next[index], weight: Math.max(0, Math.min(100, newWeight)) };
    setAllocations(next);
    setApplied(false);
  };

  const handleNormalizeWeights = () => {
    if (totalWeight <= 0) return;
    const next = allocations.map(a => ({
      ...a,
      weight: Math.round((a.weight / totalWeight) * 100)
    }));
    // Fix rounding delta on first item
    const currentSum = next.reduce((s, a) => s + a.weight, 0);
    if (currentSum !== 100 && next.length > 0) {
      next[0].weight += (100 - currentSum);
    }
    setAllocations(next);
  };

  const handleApply = () => {
    if (onApplyToWorkspace) {
      onApplyToWorkspace(allocations);
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  const handleOpenInBacktester = () => {
    if (studio) {
      studio.setBacktestParams({
        initialValue,
        startYear,
        endYear,
        cashFlowType: 'none',
        cashFlowAmount: 0,
        benchmark
      });
    }
    if (onApplyToWorkspace) {
      onApplyToWorkspace(allocations);
    }
    if (onNavigateTab) {
      onNavigateTab('backtesting');
    }
  };

  const chartData = result.yearHistory.map(y => ({
    label: y.year,
    value: y.endBalance,
    benchmark: y.benchmarkBalance
  }));

  const donutData = result.allocations.map(a => ({
    label: a.symbol,
    value: a.weight
  }));

  return (
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-graphite-card p-4 space-y-4 my-2 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono font-medium uppercase tracking-wider text-graphite-lightText dark:text-graphite-text">
            {payload?.title ?? 'Interactive Strategy Backtest'}
          </span>
          <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
            [{startYear}-{endYear}]
          </span>
        </div>
        <div className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tabular">
          CALC: &lt;1ms
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono tabular">
        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Ending Balance</div>
          <div className="text-sm font-semibold text-primary mt-0.5">${result.finalValue.toLocaleString()}</div>
        </div>
        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">CAGR</div>
          <div className="text-sm font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">{result.cagr}%</div>
        </div>
        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Sharpe Ratio</div>
          <div className="text-sm font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">{result.sharpeRatio}</div>
        </div>
        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Max Drawdown</div>
          <div className="text-sm font-semibold text-semantic-negativeLight dark:text-semantic-negative mt-0.5">{result.maxDrawdown}%</div>
        </div>
      </div>

      {/* Embedded Chart */}
      <div className="p-2 rounded-lg bg-graphite-lightRaised/60 dark:bg-graphite-raised/60">
        <LineChart
          data={chartData}
          height={200}
          valuePrefix="$"
          seriesName={payload?.title ?? 'Strategy'}
          benchmarkName={`Benchmark (${benchmark})`}
        />
      </div>

      {/* Interactive Controls & Asset Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
        
        {/* Sliders */}
        <div className="md:col-span-8 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-graphite-lightSecondary dark:text-graphite-secondary">
            <span>Asset Allocations</span>
            <div className="flex items-center gap-2">
              <span className={`font-mono tabular ${totalWeight === 100 ? 'text-primary font-semibold' : 'text-semantic-warningLight dark:text-semantic-warning'}`}>
                {totalWeight}% Total
              </span>
              {totalWeight !== 100 && (
                <button
                  type="button"
                  onClick={handleNormalizeWeights}
                  className="text-[10px] underline text-graphite-lightMuted dark:text-graphite-muted hover:text-primary transition-colors flex items-center gap-0.5"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Normalize</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {allocations.map((alloc, idx) => (
              <div key={alloc.symbol} className="flex items-center gap-2">
                <span className="w-12 font-mono font-medium text-[11px] text-graphite-lightText dark:text-graphite-text">
                  {alloc.symbol}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={alloc.weight}
                  aria-label={`${alloc.symbol} weight percentage`}
                  onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
                  className="flex-1 accent-primary cursor-pointer h-1.5"
                />
                <span className="w-10 text-right font-mono tabular text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary">
                  {alloc.weight}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Donut & Controls */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-2 rounded-lg bg-graphite-lightRaised/40 dark:bg-graphite-raised/40">
          <DonutChart items={donutData} size={110} />
          <div className="flex items-center gap-2 mt-2 w-full">
            <div className="flex-1">
              <label htmlFor={`start-yr-${uid}`} className="sr-only">Start Year</label>
              <select
                id={`start-yr-${uid}`}
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full text-[11px] px-1.5 py-1 rounded bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] font-mono tabular text-graphite-lightText dark:text-graphite-text"
              >
                {[2010, 2012, 2014, 2015, 2016, 2018, 2020].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor={`end-yr-${uid}`} className="sr-only">End Year</label>
              <select
                id={`end-yr-${uid}`}
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full text-[11px] px-1.5 py-1 rounded bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] font-mono tabular text-graphite-lightText dark:text-graphite-text"
              >
                {[2022, 2023, 2024, 2025].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
        <button
          type="button"
          onClick={handleApply}
          className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-xs transition-colors flex items-center gap-1.5"
        >
          {applied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Applied to Workspace</span>
            </>
          ) : (
            <>
              <Sliders className="w-3.5 h-3.5" />
              <span>Apply to Workspace</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleOpenInBacktester}
          className="px-3 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-graphite-lightText dark:text-graphite-text font-medium text-xs transition-colors flex items-center gap-1"
        >
          <span>Open in Backtester</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </button>
      </div>

    </div>
  );
};
