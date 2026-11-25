import React, { useState, useMemo, useEffect, useRef } from 'react';
import { runOptimization, OptimizationResult, OptimizationAssetInput } from '../../services/optimizationEngine';
import { GenerativeWidgetProps, WidgetPayloadMap } from './types';
import { ASSET_DATABASE } from '../../data/assets';
import { Sliders, Check, ExternalLink, X } from 'lucide-react';

export const MptFrontierWidget: React.FC<GenerativeWidgetProps<WidgetPayloadMap['mpt_frontier']>> = ({
  payload,
  onApplyToWorkspace,
  onNavigateTab
}) => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() =>
    Array.isArray(payload?.symbols) && payload.symbols.length >= 2
      ? payload.symbols
      : ['VTI', 'BND', 'GLD', 'VNQ']
  );
  const [riskFreeRate, setRiskFreeRate] = useState<number>(payload?.riskFreeRate ?? 0.04);
  const [applied, setApplied] = useState<boolean>(false);

  const payloadKey = JSON.stringify({
    symbols: payload?.symbols,
    riskFreeRate: payload?.riskFreeRate
  });
  const prevPayloadKeyRef = useRef<string>(payloadKey);

  useEffect(() => {
    if (payloadKey !== prevPayloadKeyRef.current) {
      prevPayloadKeyRef.current = payloadKey;
      if (Array.isArray(payload?.symbols) && payload.symbols.length >= 2) {
        setSelectedSymbols(payload.symbols);
      }
      if (payload?.riskFreeRate !== undefined) {
        setRiskFreeRate(payload.riskFreeRate);
      }
    }
  }, [payloadKey, payload]);

  // Compute optimization
  const optimizationAssets: OptimizationAssetInput[] = useMemo(() => {
    const equalWeight = Math.round(100 / selectedSymbols.length);
    return selectedSymbols.map((symbol, idx) => ({
      symbol,
      currentWeight: idx === 0 ? 100 - equalWeight * (selectedSymbols.length - 1) : equalWeight
    }));
  }, [selectedSymbols]);

  const result: OptimizationResult = useMemo(() => {
    return runOptimization(optimizationAssets, riskFreeRate);
  }, [optimizationAssets, riskFreeRate]);

  const handleApplyMaxSharpe = () => {
    if (onApplyToWorkspace) {
      const allocations = Object.entries(result.maxSharpePortfolio.weights).map(([symbol, weight]) => ({
        symbol,
        weight
      }));
      onApplyToWorkspace(allocations);
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  const handleToggleSymbol = (symbol: string) => {
    if (selectedSymbols.includes(symbol)) {
      if (selectedSymbols.length <= 2) return; // Keep at least 2 assets
      setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
    } else {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
    setApplied(false);
  };

  // SVG Chart bounds
  const frontier = result.efficientFrontier;
  const allVols = [
    ...frontier.map(p => p.volatility),
    result.minVolatilityPortfolio.volatility,
    result.maxSharpePortfolio.volatility
  ];
  const allRets = [
    ...frontier.map(p => p.expectedReturn),
    result.minVolatilityPortfolio.expectedReturn,
    result.maxSharpePortfolio.expectedReturn
  ];

  const minX = Math.max(0, Math.min(...allVols) * 0.85);
  const maxX = Math.max(...allVols) * 1.15 || 25;
  const minY = Math.max(0, Math.min(...allRets) * 0.85);
  const maxY = Math.max(...allRets) * 1.15 || 20;

  const width = 500;
  const height = 240;
  const pad = { top: 20, right: 24, bottom: 32, left: 44 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const getSvgX = (vol: number) => pad.left + ((vol - minX) / (maxX - minX || 1)) * plotW;
  const getSvgY = (ret: number) => pad.top + plotH - ((ret - minY) / (maxY - minY || 1)) * plotH;

  const frontierPolyline = frontier.map(p => `${getSvgX(p.volatility)},${getSvgY(p.expectedReturn)}`).join(' ');

  return (
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-graphite-card p-4 space-y-4 my-2 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono font-medium uppercase tracking-wider text-graphite-lightText dark:text-graphite-text">
            {payload?.title ?? 'Markowitz Efficient Frontier'}
          </span>
          <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
            [{selectedSymbols.length} Assets]
          </span>
        </div>
        <div className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tabular">
          CALC: &lt;1ms
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono tabular">
        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised border-l-2 border-primary">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Max Sharpe Portfolio</div>
          <div className="text-sm font-semibold text-primary mt-0.5">
            {result.maxSharpePortfolio.expectedReturn}% Return
          </div>
          <div className="text-[10px] text-graphite-lightSecondary dark:text-graphite-secondary mt-0.5">
            Vol: {result.maxSharpePortfolio.volatility}% · SR: {result.maxSharpePortfolio.sharpeRatio}
          </div>
        </div>

        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised border-l-2 border-graphite-secondary">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Min Volatility Portfolio</div>
          <div className="text-sm font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">
            {result.minVolatilityPortfolio.volatility}% Vol
          </div>
          <div className="text-[10px] text-graphite-lightSecondary dark:text-graphite-secondary mt-0.5">
            Return: {result.minVolatilityPortfolio.expectedReturn}% · SR: {result.minVolatilityPortfolio.sharpeRatio}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Risk-Free Rate</div>
          <div className="text-sm font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">
            {(riskFreeRate * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">3-Month Treasury</div>
        </div>
      </div>

      {/* SVG Frontier Plot */}
      <div className="p-2 rounded-lg bg-graphite-lightRaised/60 dark:bg-graphite-raised/60">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
            const yVal = minY + step * (maxY - minY);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={pad.left}
                  y1={getSvgY(yVal)}
                  x2={width - pad.right}
                  y2={getSvgY(yVal)}
                  stroke="currentColor"
                  className="text-black/[0.06] dark:text-white/[0.06]"
                  strokeDasharray="2 3"
                />
                <text
                  x={pad.left - 6}
                  y={getSvgY(yVal) + 3}
                  textAnchor="end"
                  className="text-[9px] fill-graphite-lightMuted dark:fill-graphite-muted font-mono tabular"
                >
                  {yVal.toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Hyperbola Curve */}
          <polyline
            points={frontierPolyline}
            fill="none"
            stroke="#ff5f14"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Min Volatility Point */}
          <circle
            cx={getSvgX(result.minVolatilityPortfolio.volatility)}
            cy={getSvgY(result.minVolatilityPortfolio.expectedReturn)}
            r="5"
            fill="#969696"
            stroke="currentColor"
            className="text-white dark:text-graphite-card"
            strokeWidth="1.5"
          />

          {/* Max Sharpe Point (Highlighted) */}
          <circle
            cx={getSvgX(result.maxSharpePortfolio.volatility)}
            cy={getSvgY(result.maxSharpePortfolio.expectedReturn)}
            r="6"
            fill="#ff5f14"
            stroke="currentColor"
            className="text-white dark:text-graphite-card"
            strokeWidth="2"
          />

          {/* Labels for points */}
          <text
            x={getSvgX(result.maxSharpePortfolio.volatility) + 8}
            y={getSvgY(result.maxSharpePortfolio.expectedReturn) - 4}
            className="text-[10px] font-mono fill-primary font-semibold"
          >
            Max Sharpe ({result.maxSharpePortfolio.sharpeRatio})
          </text>

          <text
            x={getSvgX(result.minVolatilityPortfolio.volatility) + 8}
            y={getSvgY(result.minVolatilityPortfolio.expectedReturn) + 12}
            className="text-[9px] font-mono fill-graphite-lightMuted dark:fill-graphite-muted"
          >
            Min Vol ({result.minVolatilityPortfolio.volatility}%)
          </text>

          {/* Axes labels */}
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            className="text-[10px] fill-graphite-lightMuted dark:fill-graphite-muted font-mono"
          >
            Volatility / Risk (σ)
          </text>
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2 text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            <span>Max Sharpe Portfolio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#969696] inline-block" />
            <span>Min Volatility Portfolio</span>
          </div>
        </div>
      </div>

      {/* Asset Universe Chips & Risk-Free Slider */}
      <div className="space-y-3 pt-1">
        <div>
          <div className="text-[11px] font-medium text-graphite-lightSecondary dark:text-graphite-secondary mb-1.5">
            Asset Universe (Select to Include in Optimization)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ASSET_DATABASE.slice(0, 10).map(asset => {
              const active = selectedSymbols.includes(asset.symbol);
              return (
                <button
                  key={asset.symbol}
                  type="button"
                  onClick={() => handleToggleSymbol(asset.symbol)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
                    active
                      ? 'bg-primary text-white font-medium'
                      : 'bg-graphite-lightRaised dark:bg-graphite-raised text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text'
                  }`}
                >
                  <span>{asset.symbol}</span>
                  {active && selectedSymbols.length > 2 && (
                    <X className="w-2.5 h-2.5 opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Risk-free slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary whitespace-nowrap">
            Risk-Free Rate:
          </span>
          <input
            type="range"
            min="0"
            max="0.08"
            step="0.005"
            value={riskFreeRate}
            aria-label="Risk-free rate percentage"
            onChange={(e) => setRiskFreeRate(Number(e.target.value))}
            className="flex-1 accent-primary cursor-pointer h-1.5"
          />
          <span className="font-mono tabular text-[11px] text-graphite-lightText dark:text-graphite-text w-12 text-right">
            {(riskFreeRate * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Max Sharpe Allocations Breakdown */}
      <div className="p-2.5 rounded-lg bg-graphite-lightRaised/40 dark:bg-graphite-raised/40">
        <div className="text-[11px] font-medium text-graphite-lightText dark:text-graphite-text mb-1.5">
          Optimal Max Sharpe Weights:
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[11px] tabular">
          {Object.entries(result.maxSharpePortfolio.weights).map(([symbol, weight]) => (
            <div key={symbol} className="px-2 py-0.5 rounded bg-white dark:bg-graphite-card border border-black/[0.06] dark:border-white/[0.06]">
              <span className="font-semibold text-graphite-lightText dark:text-graphite-text">{symbol}:</span>{' '}
              <span className="text-primary">{weight.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
        <button
          type="button"
          onClick={handleApplyMaxSharpe}
          className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-xs transition-colors flex items-center gap-1.5"
        >
          {applied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Applied Max Sharpe</span>
            </>
          ) : (
            <>
              <Sliders className="w-3.5 h-3.5" />
              <span>Apply Max Sharpe</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab?.('optimization')}
          className="px-3 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-graphite-lightText dark:text-graphite-text font-medium text-xs transition-colors flex items-center gap-1"
        >
          <span>Open in Optimization Studio</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </button>
      </div>

    </div>
  );
};
