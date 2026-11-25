import React, { useState, useEffect, useRef } from 'react';
import { runOptimization, OptimizationResult } from '../services/optimizationEngine';
import { ASSET_DATABASE, getAsset } from '../data/assets';
import { useStudioContext } from '../context/StudioContext';
import { Sliders, Check, ExternalLink } from 'lucide-react';

const DEFAULT_OPT_SYMBOLS = ['VTI', 'VXUS', 'BND', 'GLD', 'QQQ'];

const getValidSymbolsFromAllocations = (allocations: { symbol: string; weight: number }[]): string[] => {
  const unique: string[] = [];
  for (const item of allocations) {
    const asset = getAsset(item.symbol);
    if (asset && !unique.includes(asset.symbol)) {
      unique.push(asset.symbol);
    }
  }
  return unique.length >= 2 ? unique.slice(0, 8) : DEFAULT_OPT_SYMBOLS;
};

const buildOptimizationInputs = (symbols: string[], allocations: { symbol: string; weight: number }[]) => {
  const fallbackWeight = Number((100 / symbols.length).toFixed(1));
  return symbols.map(s => {
    const match = allocations.find(a => a.symbol.toUpperCase() === s.toUpperCase());
    return {
      symbol: s,
      currentWeight: match ? match.weight : fallbackWeight
    };
  });
};

export const OptimizationPage: React.FC = () => {
  const { activeAllocations, applyAllocationsToWorkspace, setActiveTab } = useStudioContext();

  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() =>
    getValidSymbolsFromAllocations(activeAllocations)
  );
  const [riskFreeRate] = useState<number>(0.04);
  const [appliedCard, setAppliedCard] = useState<'maxSharpe' | 'minVol' | 'riskParity' | null>(null);

  const [result, setResult] = useState<OptimizationResult>(() => {
    const initSymbols = getValidSymbolsFromAllocations(activeAllocations);
    return runOptimization(buildOptimizationInputs(initSymbols, activeAllocations), 0.04);
  });

  const prevActiveSymbolsRef = useRef<string>(
    getValidSymbolsFromAllocations(activeAllocations).join(',')
  );

  useEffect(() => {
    const nextSymbols = getValidSymbolsFromAllocations(activeAllocations);
    const nextKey = nextSymbols.join(',');
    if (nextKey !== prevActiveSymbolsRef.current) {
      prevActiveSymbolsRef.current = nextKey;
      setSelectedSymbols(nextSymbols);
      setResult(runOptimization(buildOptimizationInputs(nextSymbols, activeAllocations), riskFreeRate));
    }
  }, [activeAllocations, riskFreeRate]);

  const weightsToAllocations = (weights: Record<string, number>) =>
    Object.entries(weights).map(([symbol, weight]) => ({ symbol, weight }));

  const handleApplyPortfolio = (card: 'maxSharpe' | 'minVol' | 'riskParity', weights: Record<string, number>) => {
    applyAllocationsToWorkspace(weightsToAllocations(weights));
    setAppliedCard(card);
    setTimeout(() => setAppliedCard(prev => (prev === card ? null : prev)), 2500);
  };

  const handleOpenInBacktester = (weights: Record<string, number>) => {
    applyAllocationsToWorkspace(weightsToAllocations(weights));
    setActiveTab('backtesting');
  };

  const handleRun = () => {
    const inputs = selectedSymbols.map(s => ({
      symbol: s,
      currentWeight: Number((100 / selectedSymbols.length).toFixed(1))
    }));
    setResult(runOptimization(inputs, riskFreeRate));
  };

  const handleAddSymbol = (sym: string) => {
    if (selectedSymbols.includes(sym) || selectedSymbols.length >= 8) return;
    const updated = [...selectedSymbols, sym];
    setSelectedSymbols(updated);
    const inputs = updated.map(s => ({
      symbol: s,
      currentWeight: Number((100 / updated.length).toFixed(1))
    }));
    setResult(runOptimization(inputs, riskFreeRate));
  };

  const handleRemoveSymbol = (sym: string) => {
    if (selectedSymbols.length <= 2) return;
    const updated = selectedSymbols.filter(s => s !== sym);
    setSelectedSymbols(updated);
    const inputs = updated.map(s => ({
      symbol: s,
      currentWeight: Number((100 / updated.length).toFixed(1))
    }));
    setResult(runOptimization(inputs, riskFreeRate));
  };

  // Efficient Frontier Chart coordinates
  const frontierPoints = result.efficientFrontier;
  const minVol = Math.min(...frontierPoints.map(p => p.volatility), result.minVolatilityPortfolio.volatility) * 0.9;
  const maxVol = Math.max(...frontierPoints.map(p => p.volatility), result.maxSharpePortfolio.volatility) * 1.1;
  const minRet = Math.min(...frontierPoints.map(p => p.expectedReturn), result.minVolatilityPortfolio.expectedReturn) * 0.9;
  const maxRet = Math.max(...frontierPoints.map(p => p.expectedReturn), result.maxSharpePortfolio.expectedReturn) * 1.1;

  const width = 700;
  const height = 280;
  const pad = { top: 20, right: 30, bottom: 36, left: 56 };
  const getX = (v: number) => pad.left + ((v - minVol) / (maxVol - minVol || 1)) * (width - pad.left - pad.right);
  const getY = (r: number) => pad.top + (height - pad.top - pad.bottom) - ((r - minRet) / (maxRet - minRet || 1)) * (height - pad.top - pad.bottom);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
          <span className="text-primary font-semibold">[SYS.02]</span>
          <span>/</span>
          <span>MARKOWITZ COVARIANCE &amp; OPTIMIZATION</span>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-graphite-lightText dark:text-graphite-text">
          Portfolio optimization
        </h1>
        <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
          Modern Portfolio Theory (MPT) Markowitz Efficient Frontier: Max Sharpe ratio and minimum volatility.
        </p>
      </div>

      {/* Asset Selection Bar */}
      <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Selected asset universe</div>
            <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">2 to 8 assets used for covariance matrix modeling</div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="opt-add-symbol" className="sr-only">
              Add asset symbol to universe
            </label>
            <select
              id="opt-add-symbol"
              onChange={(e) => {
                if (e.target.value) handleAddSymbol(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="text-xs px-2.5 py-2 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text"
            >
              <option value="" disabled>+ Add symbol</option>
              {ASSET_DATABASE.filter(a => !selectedSymbols.includes(a.symbol)).map(a => (
                <option key={a.symbol} value={a.symbol}>{a.symbol} · {a.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRun}
              className="text-xs px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
            >
              Calculate Efficient Frontier
            </button>
          </div>
        </div>

        {/* Selected asset chips */}
        <div className="flex flex-wrap gap-2">
          {selectedSymbols.map(sym => (
            <div
              key={sym}
              className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 rounded-md bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] text-xs font-mono font-medium text-graphite-lightText dark:text-graphite-text"
            >
              <span>{sym}</span>
              <button
                type="button"
                onClick={() => handleRemoveSymbol(sym)}
                disabled={selectedSymbols.length <= 2}
                aria-label={`Remove ${sym} from universe`}
                className="opacity-60 hover:opacity-100 disabled:opacity-20 ml-1 p-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Portfolio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Max Sharpe */}
        <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Max Sharpe ratio</div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Optimal</span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono tabular">
            <div className="p-2 rounded bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Return</div>
              <div className="text-xs font-medium text-primary mt-0.5">{result.maxSharpePortfolio.expectedReturn}%</div>
            </div>
            <div className="p-2 rounded bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Volatility</div>
              <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">{result.maxSharpePortfolio.volatility}%</div>
            </div>
            <div className="p-2 rounded bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Sharpe</div>
              <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">{result.maxSharpePortfolio.sharpeRatio}</div>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
            {Object.entries(result.maxSharpePortfolio.weights).map(([s, w]) => (
              <div key={s} className="flex justify-between text-xs font-mono tabular">
                <span className="text-graphite-lightSecondary dark:text-graphite-secondary">{s}</span>
                <span className="font-medium text-graphite-lightText dark:text-graphite-text">{w}%</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => handleApplyPortfolio('maxSharpe', result.maxSharpePortfolio.weights)}
              className="flex-1 min-h-[44px] px-2.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
            >
              {appliedCard === 'maxSharpe' ? (
                <>
                  <Check className="w-3 h-3" aria-hidden="true" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3 h-3" aria-hidden="true" />
                  <span>Apply to Workspace</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleOpenInBacktester(result.maxSharpePortfolio.weights)}
              className="min-h-[44px] px-2.5 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-graphite-lightText dark:text-graphite-text text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
            >
              <span>Open in Backtester</span>
              <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Min Volatility */}
        <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
          <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Minimum volatility</div>

          <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono tabular">
            <div className="p-2 rounded bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Return</div>
              <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">{result.minVolatilityPortfolio.expectedReturn}%</div>
            </div>
            <div className="p-2 rounded bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Volatility</div>
              <div className="text-xs font-medium text-primary mt-0.5">{result.minVolatilityPortfolio.volatility}%</div>
            </div>
            <div className="p-2 rounded bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Sharpe</div>
              <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">{result.minVolatilityPortfolio.sharpeRatio}</div>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
            {Object.entries(result.minVolatilityPortfolio.weights).map(([s, w]) => (
              <div key={s} className="flex justify-between text-xs font-mono tabular">
                <span className="text-graphite-lightSecondary dark:text-graphite-secondary">{s}</span>
                <span className="font-medium text-graphite-lightText dark:text-graphite-text">{w}%</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => handleApplyPortfolio('minVol', result.minVolatilityPortfolio.weights)}
              className="flex-1 min-h-[44px] px-2.5 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-primary hover:text-white dark:hover:bg-primary text-graphite-lightText dark:text-graphite-text text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
            >
              {appliedCard === 'minVol' ? (
                <>
                  <Check className="w-3 h-3" aria-hidden="true" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3 h-3" aria-hidden="true" />
                  <span>Apply to Workspace</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleOpenInBacktester(result.minVolatilityPortfolio.weights)}
              className="min-h-[44px] px-2.5 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-graphite-lightText dark:text-graphite-text text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
            >
              <span>Open in Backtester</span>
              <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Risk Parity */}
        <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
          <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Risk parity (equal risk)</div>

          <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono tabular">
            <div className="p-2 rounded bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Return</div>
              <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">{result.riskParityPortfolio.expectedReturn}%</div>
            </div>
            <div className="p-2 rounded bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Volatility</div>
              <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">{result.riskParityPortfolio.volatility}%</div>
            </div>
            <div className="p-2 rounded bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Sharpe</div>
              <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text mt-0.5">{result.riskParityPortfolio.sharpeRatio}</div>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
            {Object.entries(result.riskParityPortfolio.weights).map(([s, w]) => (
              <div key={s} className="flex justify-between text-xs font-mono tabular">
                <span className="text-graphite-lightSecondary dark:text-graphite-secondary">{s}</span>
                <span className="font-medium text-graphite-lightText dark:text-graphite-text">{w}%</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => handleApplyPortfolio('riskParity', result.riskParityPortfolio.weights)}
              className="flex-1 min-h-[44px] px-2.5 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-primary hover:text-white dark:hover:bg-primary text-graphite-lightText dark:text-graphite-text text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
            >
              {appliedCard === 'riskParity' ? (
                <>
                  <Check className="w-3 h-3" aria-hidden="true" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <Sliders className="w-3 h-3" aria-hidden="true" />
                  <span>Apply to Workspace</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleOpenInBacktester(result.riskParityPortfolio.weights)}
              className="min-h-[44px] px-2.5 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-graphite-lightText dark:text-graphite-text text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
            >
              <span>Open in Backtester</span>
              <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
            </button>
          </div>
        </div>

      </div>

      {/* Efficient Frontier Curve */}
      <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Efficient frontier hyperbola</div>
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">X: Volatility (σ) · Y: Expected Return</div>
        </div>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" style={{ minWidth: 480 }}>
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
              const rVal = minRet + t * (maxRet - minRet);
              return (
                <g key={idx}>
                  <line x1={pad.left} y1={getY(rVal)} x2={width - pad.right} y2={getY(rVal)} stroke="currentColor" className="text-black/[0.06] dark:text-white/[0.06]" strokeDasharray="2 3" />
                  <text x={pad.left - 8} y={getY(rVal) + 3} textAnchor="end" className="text-[10px] fill-graphite-lightMuted dark:fill-graphite-muted font-mono tabular">{rVal.toFixed(1)}%</text>
                </g>
              );
            })}

            {/* Frontier Line */}
            <path
              d={frontierPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.volatility)} ${getY(p.expectedReturn)}`).join(' ')}
              fill="none"
              stroke="#ff5f14"
              strokeWidth="2"
            />

            {/* Max Sharpe Marker */}
            <circle
              cx={getX(result.maxSharpePortfolio.volatility)}
              cy={getY(result.maxSharpePortfolio.expectedReturn)}
              r="4.5"
              fill="#ff5f14"
              stroke="currentColor"
              className="text-white dark:text-graphite-card"
              strokeWidth="1.5"
            />
            <text
              x={getX(result.maxSharpePortfolio.volatility) + 8}
              y={getY(result.maxSharpePortfolio.expectedReturn) - 6}
              className="text-[10px] font-mono fill-graphite-lightText dark:fill-graphite-text font-medium"
            >
              Max Sharpe ({result.maxSharpePortfolio.expectedReturn}%, {result.maxSharpePortfolio.volatility}%)
            </text>

            {/* Min Vol Marker */}
            <circle
              cx={getX(result.minVolatilityPortfolio.volatility)}
              cy={getY(result.minVolatilityPortfolio.expectedReturn)}
              r="4"
              fill="#969696"
              stroke="currentColor"
              className="text-white dark:text-graphite-card"
              strokeWidth="1.5"
            />
            <text
              x={getX(result.minVolatilityPortfolio.volatility) + 8}
              y={getY(result.minVolatilityPortfolio.expectedReturn) + 12}
              className="text-[10px] font-mono fill-graphite-lightMuted dark:fill-graphite-muted"
            >
              Min Vol ({result.minVolatilityPortfolio.volatility}%)
            </text>
          </svg>
        </div>
      </div>

      {/* Correlation Matrix Heatmap */}
      <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
        <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Pairwise correlation matrix</div>
        <div className="overflow-x-auto">
          <table className="text-xs text-center border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left font-mono font-medium text-graphite-lightMuted dark:text-graphite-muted">Symbol</th>
                {result.correlationMatrix.symbols.map(s => (
                  <th key={s} className="p-2 font-mono font-medium text-graphite-lightText dark:text-graphite-text">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.correlationMatrix.symbols.map((symRow, i) => (
                <tr key={symRow}>
                  <td className="p-2 font-mono font-medium text-left text-graphite-lightText dark:text-graphite-text">{symRow}</td>
                  {result.correlationMatrix.matrix[i].map((val, j) => {
                    const isDiag = i === j;
                    const bg = isDiag
                      ? 'bg-black/[0.08] dark:bg-white/[0.08] text-graphite-lightText dark:text-graphite-text font-bold'
                      : val > 0.6
                      ? 'bg-black/[0.04] dark:bg-white/[0.05] text-graphite-lightText dark:text-graphite-text'
                      : 'bg-transparent text-graphite-lightMuted dark:text-graphite-muted';

                    return (
                      <td key={j} className="p-1">
                        <div className={`w-12 py-1 rounded text-[11px] font-mono tabular ${bg}`}>
                          {val.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
