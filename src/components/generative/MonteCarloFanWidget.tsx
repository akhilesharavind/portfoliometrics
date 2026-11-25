import React, { useState, useMemo } from 'react';
import { runMonteCarloSimulation, MonteCarloResult } from '../../services/monteCarloEngine';
import { GenerativeWidgetProps, WidgetPayloadMap } from './types';
import { RefreshCw, ExternalLink } from 'lucide-react';

export const MonteCarloFanWidget: React.FC<GenerativeWidgetProps<WidgetPayloadMap['monte_carlo_fan']>> = ({
  payload,
  onNavigateTab
}) => {
  const initialInvestment = payload?.initialInvestment ?? 500000;
  const [expectedReturn, setExpectedReturn] = useState<number>(payload?.expectedAnnualReturn ?? 7.5);
  const annualVolatility = payload?.annualVolatility ?? 15.0;
  const [annualWithdrawal, setAnnualWithdrawal] = useState<number>(payload?.annualWithdrawal ?? 20000);
  const [years, setYears] = useState<number>(payload?.years ?? 25);
  const [simSeed, setSimSeed] = useState<number>(0);

  // Execute 1,000 simulation trials
  const result: MonteCarloResult = useMemo(() => {
    void simSeed;
    return runMonteCarloSimulation({
      initialInvestment,
      expectedAnnualReturn: expectedReturn,
      annualVolatility,
      annualWithdrawal,
      inflationRate: 2.5,
      years,
      simulationsCount: 1000
    });
  }, [initialInvestment, expectedReturn, annualVolatility, annualWithdrawal, years, simSeed]);

  const handleResimulate = () => {
    setSimSeed(prev => prev + 1);
  };

  // SVG Chart bounds
  const points = result.percentilesByYear;
  const maxBalance = Math.max(...points.map(p => p.p90)) * 1.1 || 100000;
  const width = 500;
  const height = 220;
  const pad = { top: 16, right: 20, bottom: 28, left: 50 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const getSvgX = (year: number) => pad.left + (years > 0 ? (year / years) * plotW : 0);
  const getSvgY = (val: number) => pad.top + plotH - (Math.max(0, val) / maxBalance) * plotH;

  // Build polygon areas for fan curve
  // Outer fan (p10 to p90)
  const p90Forward = points.map(p => `${getSvgX(p.year)},${getSvgY(p.p90)}`);
  const p10Backward = [...points].reverse().map(p => `${getSvgX(p.year)},${getSvgY(p.p10)}`);
  const outerFan = [...p90Forward, ...p10Backward].join(' ');

  // Mid fan (p25 to p75)
  const p75Forward = points.map(p => `${getSvgX(p.year)},${getSvgY(p.p75)}`);
  const p25Backward = [...points].reverse().map(p => `${getSvgX(p.year)},${getSvgY(p.p25)}`);
  const midFan = [...p75Forward, ...p25Backward].join(' ');

  // Median line (p50)
  const p50Line = points.map(p => `${getSvgX(p.year)},${getSvgY(p.p50)}`).join(' ');

  return (
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-graphite-card p-4 space-y-4 my-2 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono font-medium uppercase tracking-wider text-graphite-lightText dark:text-graphite-text">
            {payload?.title ?? 'Monte Carlo Retirement Fan'}
          </span>
          <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
            [1,000 Stochastic Trials]
          </span>
        </div>
        <div className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tabular">
          HORIZON: {years} YRS
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono tabular">
        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Survival Probability</div>
          <div className={`text-sm font-semibold mt-0.5 ${
            result.probabilityOfSuccess >= 85 
              ? 'text-semantic-positiveLight dark:text-semantic-positive'
              : result.probabilityOfSuccess >= 70
              ? 'text-semantic-warningLight dark:text-semantic-warning'
              : 'text-semantic-negativeLight dark:text-semantic-negative'
          }`}>
            {result.probabilityOfSuccess}%
          </div>
        </div>

        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Median Ending Wealth</div>
          <div className="text-sm font-semibold text-primary mt-0.5">
            ${result.medianFinalBalance.toLocaleString()}
          </div>
        </div>

        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">10th Percentile (Stress)</div>
          <div className="text-sm font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">
            ${(result.percentilesByYear[result.percentilesByYear.length - 1]?.p10 || 0).toLocaleString()}
          </div>
        </div>

        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Annual Withdrawal</div>
          <div className="text-sm font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">
            ${annualWithdrawal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* SVG Percentile Fan Curve */}
      <div className="p-2 rounded-lg bg-graphite-lightRaised/60 dark:bg-graphite-raised/60">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Y Grid Ticks */}
          {[0, 0.33, 0.66, 1].map((step, i) => {
            const yVal = step * maxBalance;
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
                  ${yVal >= 1000000 ? `${(yVal / 1000000).toFixed(1)}M` : `${(yVal / 1000).toFixed(0)}k`}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {Array.from(new Set([0, Math.round(years / 2), years])).map(yr => (
            <text
              key={`x-${yr}`}
              x={getSvgX(yr)}
              y={height - 8}
              textAnchor="middle"
              className="text-[9px] fill-graphite-lightMuted dark:fill-graphite-muted font-mono tabular"
            >
              Yr {yr}
            </text>
          ))}

          {/* Outer Envelope (p10 to p90) */}
          <polygon
            points={outerFan}
            fill="#ff5f14"
            fillOpacity="0.08"
          />

          {/* Inner Envelope (p25 to p75) */}
          <polygon
            points={midFan}
            fill="#ff5f14"
            fillOpacity="0.16"
          />

          {/* Median Line (p50) */}
          <polyline
            points={p50Line}
            fill="none"
            stroke="#ff5f14"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2 text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-primary inline-block" />
            <span>Median (p50)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-primary/20 inline-block" />
            <span>25th - 75th Percentile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-primary/10 inline-block" />
            <span>10th - 90th Envelope</span>
          </div>
        </div>
      </div>

      {/* Interactive Sliders */}
      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Withdrawal Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
              <span>Annual Withdrawal:</span>
              <span className="font-mono tabular text-graphite-lightText dark:text-graphite-text font-medium">
                ${annualWithdrawal.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100000"
              step="2500"
              value={annualWithdrawal}
              aria-label="Annual withdrawal amount in dollars"
              onChange={(e) => setAnnualWithdrawal(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer h-1.5"
            />
          </div>

          {/* Expected Return Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
              <span>Expected Annual Return:</span>
              <span className="font-mono tabular text-graphite-lightText dark:text-graphite-text font-medium">
                {expectedReturn}%
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="14"
              step="0.5"
              value={expectedReturn}
              aria-label="Expected annual return percentage"
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer h-1.5"
            />
          </div>

        </div>

        {/* Horizon selector buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary">Horizon:</span>
          {[10, 15, 20, 25, 30].map(h => (
            <button
              key={h}
              type="button"
              onClick={() => setYears(h)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                years === h
                  ? 'bg-primary text-white font-medium'
                  : 'bg-graphite-lightRaised dark:bg-graphite-raised text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text'
              }`}
            >
              {h}y
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
        <button
          type="button"
          onClick={handleResimulate}
          className="px-3 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-graphite-lightText dark:text-graphite-text font-medium text-xs transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Simulate (1k Runs)</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab?.('monte-carlo')}
          className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-xs transition-colors flex items-center gap-1"
        >
          <span>Open in Retirement Studio</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </button>
      </div>

    </div>
  );
};
