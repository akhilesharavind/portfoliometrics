import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  runBacktest, 
  BacktestResult, 
  AllocationItem 
} from '../services/backtestingEngine';
import { ASSET_DATABASE } from '../data/assets';
import { POPULAR_PORTFOLIOS } from '../data/popularPortfolios';
import { LineChart, DonutChart } from '../components/SimpleChart';
import { useStudioContext } from '../context/StudioContext';
import { BacktestScenarioWidget } from '../components/generative/BacktestScenarioWidget';
import { 
  Plus, 
  Trash2, 
  Sliders, 
  Bot
} from 'lucide-react';

interface BacktestingPageProps {
  initialAllocations?: AllocationItem[];
}

const areAllocationsEqual = (a: AllocationItem[], b: AllocationItem[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every(
    (item, idx) =>
      item.symbol === b[idx]?.symbol &&
      Number(item.weight) === Number(b[idx]?.weight)
  );
};

const getInitialAllocations = (
  activeAllocations: AllocationItem[],
  initialAllocations?: AllocationItem[]
): AllocationItem[] => {
  if (activeAllocations && activeAllocations.length > 0) {
    return activeAllocations.map(a => ({ ...a }));
  }
  if (initialAllocations && initialAllocations.length > 0) {
    return initialAllocations.map(a => ({ ...a }));
  }
  return [
    { symbol: 'VTI', weight: 60 },
    { symbol: 'BND', weight: 40 }
  ];
};

export const BacktestingPage: React.FC<BacktestingPageProps> = ({ initialAllocations }) => {
  const { activeAllocations, setActiveAllocations, applyAllocationsToWorkspace, toggleCopilot, backtestParams } = useStudioContext();

  const [allocations, setAllocations] = useState<AllocationItem[]>(() =>
    getInitialAllocations(activeAllocations, initialAllocations)
  );

  const [initialValue, setInitialValue] = useState<number>(backtestParams?.initialValue ?? 10000);
  const [cashFlowType, setCashFlowType] = useState<'none' | 'monthly_contribution' | 'annual_contribution' | 'monthly_withdrawal'>(backtestParams?.cashFlowType ?? 'none');
  const [cashFlowAmount, setCashFlowAmount] = useState<number>(backtestParams?.cashFlowAmount ?? 500);
  const [startYear, setStartYear] = useState<number>(backtestParams?.startYear ?? 2012);
  const [endYear, setEndYear] = useState<number>(backtestParams?.endYear ?? 2025);
  const [rebalancing] = useState<'annually' | 'semi-annually' | 'quarterly' | 'monthly' | 'none'>('annually');
  const [benchmark, setBenchmark] = useState<string>(backtestParams?.benchmark ?? 'SPY');
  const [riskFreeRate] = useState<number>(0.04);

  const [result, setResult] = useState<BacktestResult>(() => {
    return runBacktest({
      allocations: getInitialAllocations(activeAllocations, initialAllocations),
      initialValue: backtestParams?.initialValue ?? 10000,
      cashFlowType: backtestParams?.cashFlowType ?? 'none',
      cashFlowAmount: backtestParams?.cashFlowAmount ?? 500,
      startYear: backtestParams?.startYear ?? 2012,
      endYear: backtestParams?.endYear ?? 2025,
      rebalancing: 'annually',
      benchmark: backtestParams?.benchmark ?? 'SPY',
      riskFreeRate: 0.04
    });
  });

  const [showGenUiPreview, setShowGenUiPreview] = useState<boolean>(false);

  const allocationsRef = useRef<AllocationItem[]>(allocations);
  const paramsRef = useRef({
    initialValue,
    cashFlowType,
    cashFlowAmount,
    startYear,
    endYear,
    rebalancing,
    benchmark,
    riskFreeRate
  });

  useEffect(() => {
    allocationsRef.current = allocations;
    paramsRef.current = {
      initialValue,
      cashFlowType,
      cashFlowAmount,
      startYear,
      endYear,
      rebalancing,
      benchmark,
      riskFreeRate
    };
  }, [allocations, initialValue, cashFlowType, cashFlowAmount, startYear, endYear, rebalancing, benchmark, riskFreeRate]);

  const prevInitialRef = useRef<AllocationItem[] | undefined>(initialAllocations);

  // Sync external initialAllocations prop only when it genuinely changes
  useEffect(() => {
    if (
      initialAllocations &&
      initialAllocations.length > 0 &&
      (!prevInitialRef.current || !areAllocationsEqual(initialAllocations, prevInitialRef.current))
    ) {
      prevInitialRef.current = initialAllocations.map(a => ({ ...a }));
      if (!areAllocationsEqual(initialAllocations, allocationsRef.current)) {
        const cloned = initialAllocations.map(a => ({ ...a }));
        setAllocations(cloned);
        setResult(runBacktest({ allocations: cloned, ...paramsRef.current }));
      }
    }
  }, [initialAllocations]);

  // Sync external backtestParams handoff from StudioContext
  useEffect(() => {
    if (!backtestParams) return;
    const nextInit = backtestParams.initialValue ?? paramsRef.current.initialValue;
    const nextStart = backtestParams.startYear ?? paramsRef.current.startYear;
    const nextEnd = backtestParams.endYear ?? paramsRef.current.endYear;
    const nextCfType = backtestParams.cashFlowType ?? paramsRef.current.cashFlowType;
    const nextCfAmt = backtestParams.cashFlowAmount ?? paramsRef.current.cashFlowAmount;
    const nextBench = backtestParams.benchmark ?? paramsRef.current.benchmark;
    setInitialValue(nextInit);
    setStartYear(nextStart);
    setEndYear(nextEnd);
    setCashFlowType(nextCfType);
    setCashFlowAmount(nextCfAmt);
    setBenchmark(nextBench);
    setResult(runBacktest({
      allocations: allocationsRef.current,
      initialValue: nextInit,
      cashFlowType: nextCfType,
      cashFlowAmount: nextCfAmt,
      startYear: nextStart,
      endYear: nextEnd,
      rebalancing: paramsRef.current.rebalancing,
      benchmark: nextBench,
      riskFreeRate: paramsRef.current.riskFreeRate
    }));
  }, [backtestParams]);

  // Synchronize external activeAllocations from StudioContext without feedback loops
  useEffect(() => {
    if (
      activeAllocations &&
      activeAllocations.length > 0 &&
      !areAllocationsEqual(activeAllocations, allocationsRef.current)
    ) {
      const cloned = activeAllocations.map(a => ({ ...a }));
      setAllocations(cloned);
      setResult(runBacktest({ allocations: cloned, ...paramsRef.current }));
    }
  }, [activeAllocations]);

  const totalWeight = allocations.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);

  const handleRun = () => {
    setActiveAllocations(allocations);
    const res = runBacktest({
      allocations,
      initialValue,
      cashFlowType,
      cashFlowAmount,
      startYear,
      endYear,
      rebalancing,
      benchmark,
      riskFreeRate
    });
    setResult(res);
  };

  const [allocNotice, setAllocNotice] = useState<string | null>(null);

  const handleAddAsset = () => {
    const used = new Set(allocations.map(a => a.symbol));
    const nextAsset = ASSET_DATABASE.find(a => !used.has(a.symbol));
    if (!nextAsset) {
      setAllocNotice('All supported assets are already included.');
      return;
    }
    setAllocNotice(null);
    const next = [...allocations, { symbol: nextAsset.symbol, weight: 10 }];
    setAllocations(next);
    setActiveAllocations(next);
  };

  const handleRemoveAsset = (index: number) => {
    if (allocations.length <= 1) {
      setAllocNotice('At least 1 asset is required for backtesting.');
      return;
    }
    setAllocNotice(null);
    const next = allocations.filter((_, i) => i !== index);
    setAllocations(next);
    setActiveAllocations(next);
  };

  const handleAllocationChange = (index: number, field: keyof AllocationItem, val: any) => {
    if (field === 'symbol') {
      const sym = String(val).toUpperCase();
      if (allocations.some((a, idx) => idx !== index && a.symbol === sym)) {
        setAllocNotice(`${sym} is already in the portfolio. Adjust its weight row instead.`);
        return;
      }
      setAllocNotice(null);
      const updated = [...allocations];
      updated[index] = { ...updated[index], symbol: sym };
      setAllocations(updated);
      setActiveAllocations(updated);
      return;
    }
    const clampedWeight = Math.max(0, Math.min(100, Number(val) || 0));
    setAllocNotice(null);
    const updated = [...allocations];
    updated[index] = { ...updated[index], weight: clampedWeight };
    setAllocations(updated);
    setActiveAllocations(updated);
  };

  const handleApplyPreset = (presetId: string) => {
    const p = POPULAR_PORTFOLIOS.find(x => x.id === presetId);
    if (!p) return;
    const newAlloc = p.allocations.map(a => ({ symbol: a.symbol, weight: a.weight }));
    setAllocations(newAlloc);
    setActiveAllocations(newAlloc);
    const res = runBacktest({
      allocations: newAlloc,
      initialValue,
      cashFlowType,
      cashFlowAmount,
      startYear,
      endYear,
      rebalancing,
      benchmark,
      riskFreeRate
    });
    setResult(res);
  };

  const explorerStrategies = useMemo(() => {
    const definitions = [
      {
        name: 'Ray Dalio All-Weather',
        desc: 'Risk parity across inflation and deflation environments',
        alloc: [
          { symbol: 'VTI', weight: 30 },
          { symbol: 'TLT', weight: 40 },
          { symbol: 'BND', weight: 15 },
          { symbol: 'GLD', weight: 7.5 },
          { symbol: 'VNQ', weight: 7.5 }
        ]
      },
      {
        name: 'High-Conviction Tech Growth',
        desc: 'Aggressive upside tilt in semiconductors and enterprise cloud',
        alloc: [
          { symbol: 'QQQ', weight: 40 },
          { symbol: 'NVDA', weight: 20 },
          { symbol: 'MSFT', weight: 20 },
          { symbol: 'AAPL', weight: 20 }
        ]
      },
      {
        name: 'Global Diversified Core',
        desc: 'Broad US equity, international, and investment-grade fixed income',
        alloc: [
          { symbol: 'VTI', weight: 60 },
          { symbol: 'VXUS', weight: 25 },
          { symbol: 'BND', weight: 15 }
        ]
      }
    ];

    return definitions.map(def => {
      const bt = runBacktest({
        allocations: def.alloc,
        initialValue: 10000,
        cashFlowType: 'none',
        cashFlowAmount: 0,
        startYear: 2015,
        endYear: 2025,
        rebalancing: 'annually',
        benchmark: 'SPY',
        riskFreeRate: 0.04
      });
      return {
        ...def,
        cagr: `${bt.cagr.toFixed(1)}%`,
        vol: `${bt.volatility.toFixed(1)}%`
      };
    });
  }, []);

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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
          <span className="text-primary font-semibold">[SYS.01]</span>
          <span>/</span>
          <span>BACKTEST SIMULATION ENGINE</span>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-graphite-lightText dark:text-graphite-text">
          Portfolio backtesting
        </h1>
        <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
          Simulate historical portfolio performance across multi-asset allocations and rebalancing intervals.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-graphite-lightMuted dark:text-graphite-muted">Presets:</span>
        {[
          { id: 'classic-60-40', label: 'Classic 60/40' },
          { id: 'all-weather', label: 'Ray Dalio All-Weather' },
          { id: 'three-fund', label: 'Three-Fund Portfolio' },
          { id: 'tech-titans', label: 'Tech & AI Growth' }
        ].map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleApplyPreset(p.id)}
            className="min-h-[44px] inline-flex items-center text-xs px-3 py-2 rounded-md bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Embedded AI Strategy Explorer Panel */}
      <div className="p-5 rounded-xl bg-graphite-lightRaised/60 dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-graphite-lightText dark:text-graphite-text">
              AI Strategy Explorer
            </h2>
            <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
              [STUDIO COPILOT SYSTEM]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGenUiPreview(!showGenUiPreview)}
              className="text-xs px-2.5 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-graphite-lightText dark:text-graphite-text font-medium transition-colors"
            >
              {showGenUiPreview ? 'Hide Generative Widget' : 'Live Scenario Widget'}
            </button>

            <button
              type="button"
              onClick={toggleCopilot}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Studio Copilot</span>
            </button>
          </div>
        </div>

        {/* Strategy comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {explorerStrategies.map((strat, idx) => (
            <div key={idx} className="p-3.5 rounded-lg bg-white dark:bg-graphite-raised border border-black/[0.06] dark:border-white/[0.06] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-graphite-lightText dark:text-graphite-text">
                  <span>{strat.name}</span>
                  <span className="font-mono text-primary tabular text-[11px]">{strat.cagr} CAGR</span>
                </div>
                <p className="text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mt-1">
                  {strat.desc}
                </p>
                <div className="mt-2 text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted truncate">
                  {strat.alloc.map(a => `${a.symbol} ${a.weight}%`).join(' · ')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAllocations(strat.alloc);
                  applyAllocationsToWorkspace(strat.alloc);
                  const res = runBacktest({
                    allocations: strat.alloc,
                    initialValue,
                    cashFlowType,
                    cashFlowAmount,
                    startYear,
                    endYear,
                    rebalancing,
                    benchmark,
                    riskFreeRate
                  });
                  setResult(res);
                }}
                className="w-full py-1.5 px-2 rounded bg-black/[0.04] dark:bg-white/[0.06] hover:bg-primary hover:text-white dark:hover:bg-primary text-graphite-lightText dark:text-graphite-text text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                <span>Apply to Workspace</span>
              </button>
            </div>
          ))}
        </div>

        {/* Collapsible Live Generative Scenario Widget */}
        {showGenUiPreview && (
          <div className="pt-2">
            <BacktestScenarioWidget
              payload={{
                title: 'Live Generative Scenario Explorer',
                allocations,
                initialValue,
                startYear,
                endYear,
                benchmark
              }}
              onApplyToWorkspace={(newAlloc) => {
                setAllocations(newAlloc);
                applyAllocationsToWorkspace(newAlloc);
                setResult(runBacktest({
                  allocations: newAlloc,
                  initialValue,
                  cashFlowType,
                  cashFlowAmount,
                  startYear,
                  endYear,
                  rebalancing,
                  benchmark,
                  riskFreeRate
                }));
              }}
              onNavigateTab={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </div>
        )}
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Asset Allocations */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Asset allocation</div>
              <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">
                Total allocation: <span className={`font-mono tabular font-medium ${totalWeight === 100 ? 'text-primary' : 'text-semantic-warningLight dark:text-semantic-warning'}`}>{totalWeight}%</span>
                {totalWeight !== 100 && <span className="ml-1 text-[10px] text-graphite-lightMuted dark:text-graphite-muted">(Normalized automatically)</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddAsset}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.05] text-graphite-lightText dark:text-graphite-text hover:bg-black/[0.08] dark:hover:bg-white/[0.08] transition-colors"
            >
              <Plus aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Add symbol</span>
            </button>
          </div>

          {/* Validation Banner if total weight is 0 */}
          {totalWeight === 0 && (
            <div role="alert" className="p-3 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warningLight dark:text-semantic-warning text-xs">
              Portfolio allocations total 0%. Allocate weight to at least one asset to simulate returns.
            </div>
          )}

          <div className="space-y-3">
            {allocations.map((alloc, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <label htmlFor={`bt-asset-select-${idx}`} className="sr-only">
                  Asset {idx + 1} symbol
                </label>
                <select
                  id={`bt-asset-select-${idx}`}
                  value={alloc.symbol}
                  onChange={(e) => handleAllocationChange(idx, 'symbol', e.target.value)}
                  className="w-44 px-2.5 py-1.5 text-xs rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-medium"
                >
                  {ASSET_DATABASE.map(a => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} · {a.name.slice(0, 22)}
                    </option>
                  ))}
                </select>

                <div className="flex-1 flex items-center gap-2">
                  <label htmlFor={`bt-asset-slider-${idx}`} className="sr-only">
                    {alloc.symbol} allocation slider
                  </label>
                  <input
                    id={`bt-asset-slider-${idx}`}
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={alloc.weight}
                    onChange={(e) => handleAllocationChange(idx, 'weight', Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="relative w-16 shrink-0">
                    <label htmlFor={`bt-asset-weight-${idx}`} className="sr-only">
                      {alloc.symbol} allocation percent
                    </label>
                    <input
                      id={`bt-asset-weight-${idx}`}
                      type="number"
                      min="0"
                      max="100"
                      value={alloc.weight}
                      onChange={(e) => handleAllocationChange(idx, 'weight', Number(e.target.value))}
                      className="w-full px-2 py-1 text-right text-xs rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
                    />
                    <span className="absolute right-1.5 top-1.5 text-[10px] text-graphite-lightMuted dark:text-graphite-muted pointer-events-none">%</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAsset(idx)}
                  aria-label={`Remove ${alloc.symbol} from portfolio`}
                  className={`p-1.5 text-graphite-lightMuted dark:text-graphite-muted hover:text-semantic-negativeLight dark:hover:text-semantic-negative transition-colors ${
                    allocations.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Parameters */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3.5">
          <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
            Parameters
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label htmlFor="bt-initial-value" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Initial investment ($)
              </label>
              <input
                id="bt-initial-value"
                type="number"
                min="100"
                value={initialValue}
                onChange={(e) => setInitialValue(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
              />
              {initialValue <= 0 && (
                <p className="text-[11px] text-semantic-negativeLight dark:text-semantic-negative mt-1">
                  Initial investment must be greater than $0.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bt-cash-flow-type" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Cash flow schedule
              </label>
              <select
                id="bt-cash-flow-type"
                value={cashFlowType}
                onChange={(e) => setCashFlowType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text"
              >
                <option value="none">None</option>
                <option value="monthly_contribution">Monthly deposit</option>
                <option value="annual_contribution">Annual deposit</option>
                <option value="monthly_withdrawal">Monthly withdrawal</option>
              </select>
            </div>

            {cashFlowType !== 'none' && (
              <div>
                <label htmlFor="bt-cash-flow-amount" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                  Cash flow amount ($)
                </label>
                <input
                  id="bt-cash-flow-amount"
                  type="number"
                  min="0"
                  value={cashFlowAmount}
                  onChange={(e) => setCashFlowAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="bt-start-year" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                  Start year
                </label>
                <select
                  id="bt-start-year"
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text tabular font-mono"
                >
                  {[2010, 2012, 2014, 2015, 2016, 2018, 2020].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="bt-end-year" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                  End year
                </label>
                <select
                  id="bt-end-year"
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text tabular font-mono"
                >
                  {[2022, 2023, 2024, 2025].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bt-benchmark" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Benchmark
              </label>
              <select
                id="bt-benchmark"
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text"
              >
                <option value="SPY">SPY (S&amp;P 500)</option>
                <option value="VTI">VTI (Total US Equities)</option>
                <option value="QQQ">QQQ (Nasdaq 100)</option>
                <option value="BND">BND (Total Bond Market)</option>
              </select>
            </div>

            <button
              type="button"
              disabled={totalWeight === 0 || initialValue <= 0}
              onClick={handleRun}
              className="w-full mt-2 py-2 px-3 min-h-[44px] rounded-md bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-medium transition-colors"
            >
              Execute Backtest Simulation
            </button>
            {(totalWeight === 0 || initialValue <= 0 || allocNotice) && (
              <p role="alert" className="text-[11px] text-semantic-warningLight dark:text-semantic-warning mt-1">
                {initialValue <= 0
                  ? 'Execution disabled: initial investment must be greater than $0.'
                  : totalWeight === 0
                    ? 'Execution disabled: total allocation weight must be greater than 0%.'
                    : allocNotice}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* KPI Cards: Numbers only, consistent format */}
      {(() => {
        const totalReturnPct = result.initialValue > 0 ? ((result.finalValue / result.initialValue - 1) * 100) : 0;
        return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Ending balance</div>
          <div className="text-xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
            ${result.finalValue.toLocaleString()}
          </div>
          <div className={`text-[10px] font-mono tabular mt-0.5 ${
            totalReturnPct >= 0
              ? 'text-semantic-positiveLight dark:text-semantic-positive'
              : 'text-semantic-negativeLight dark:text-semantic-negative'
          }`}>
            {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(1)}% total
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">
            {cashFlowType === 'none' ? 'CAGR' : 'CAGR (TWR)'}
          </div>
          <div className="text-xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
            {result.cagr}%
          </div>
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono tabular mt-0.5">
            Benchmark: {result.benchmarkCagr}%
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Annual volatility (σ)</div>
          <div className="text-xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
            {result.volatility}%
          </div>
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono tabular mt-0.5">Standard deviation</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Sharpe ratio</div>
          <div className="text-xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
            {result.sharpeRatio}
          </div>
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono tabular mt-0.5">Risk-free: 4.0%</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Max drawdown</div>
          <div className="text-xl font-mono font-medium text-semantic-negativeLight dark:text-semantic-negative tabular mt-1">
            {result.maxDrawdown}%
          </div>
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono tabular mt-0.5">Peak-to-trough</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Best / worst year</div>
          <div className="text-xs font-mono font-medium text-semantic-positiveLight dark:text-semantic-positive tabular mt-1">
            +{result.bestYear.return}% ({result.bestYear.year})
          </div>
          <div className="text-xs font-mono font-medium text-semantic-negativeLight dark:text-semantic-negative tabular mt-0.5">
            {result.worstYear.return}% ({result.worstYear.year})
          </div>
        </div>
      </div>
        );
      })()}

      {/* Line Chart */}
      <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-graphite-lightText dark:text-graphite-text">Portfolio value growth</h3>
            <p className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Compounded balance progression vs benchmark</p>
          </div>
          <div className="text-xs font-mono text-graphite-lightSecondary dark:text-graphite-secondary tabular">
            Final: ${result.finalValue.toLocaleString()}
          </div>
        </div>

        <LineChart
          data={chartData}
          height={300}
          valuePrefix="$"
          seriesName="Portfolio"
          benchmarkName={`Benchmark (${benchmark})`}
        />
      </div>

      {/* Asset Breakdown and History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Asset Breakdown */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-4">
          <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">
            Asset distribution
          </div>
          <DonutChart items={donutData} size={150} />

          <div className="space-y-1.5 pt-2">
            {result.allocations.map((a, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium text-graphite-lightText dark:text-graphite-text">{a.symbol}</span>
                  <span className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted truncate max-w-[130px]">{a.name}</span>
                </div>
                <span className="font-mono text-graphite-lightSecondary dark:text-graphite-secondary tabular">{a.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
          <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">
            Calendar year returns
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono tabular">
              <thead className="sticky top-0 bg-graphite-lightRaised dark:bg-graphite-raised text-graphite-lightMuted dark:text-graphite-muted border-b border-black/[0.08] dark:border-white/[0.08]">
                <tr>
                  <th className="py-2 px-3 font-medium">Year</th>
                  <th className="py-2 px-3 font-medium">Start balance</th>
                  <th className="py-2 px-3 font-medium">Return</th>
                  <th className="py-2 px-3 font-medium">Ending balance</th>
                  <th className="py-2 px-3 font-medium">Benchmark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-graphite-lightSecondary dark:text-graphite-secondary">
                {result.yearHistory.map((row) => (
                  <tr key={row.year} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-medium text-graphite-lightText dark:text-graphite-text">{row.year}</td>
                    <td className="py-2 px-3">${row.startBalance.toLocaleString()}</td>
                    <td className={`py-2 px-3 ${row.portfolioReturn >= 0 ? 'text-semantic-positiveLight dark:text-semantic-positive' : 'text-semantic-negativeLight dark:text-semantic-negative'}`}>
                      {row.portfolioReturn >= 0 ? `+${row.portfolioReturn}%` : `${row.portfolioReturn}%`}
                    </td>
                    <td className="py-2 px-3 font-medium text-graphite-lightText dark:text-graphite-text">${row.endBalance.toLocaleString()}</td>
                    <td className="py-2 px-3 text-graphite-lightMuted dark:text-graphite-muted">
                      {row.benchmarkReturn >= 0 ? `+${row.benchmarkReturn}%` : `${row.benchmarkReturn}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
