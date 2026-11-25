import React, { useState, useMemo, useId } from 'react';
import { calculateCagr, CagrResult } from '../../services/calculatorEngine';
import { GenerativeWidgetProps, WidgetPayloadMap } from './types';
import { useOptionalStudioContext } from '../../context/StudioContext';
import { ExternalLink } from 'lucide-react';

export const CagrProjectionWidget: React.FC<GenerativeWidgetProps<WidgetPayloadMap['cagr_projection']>> = ({
  payload,
  onNavigateTab
}) => {
  const uid = useId();
  const studio = useOptionalStudioContext();
  const gradId = `cagrAreaGrad-${uid}`;
  const [initialValue, setInitialValue] = useState<number>(payload?.initialValue ?? 10000);
  const [finalValue, setFinalValue] = useState<number>(payload?.finalValue ?? 50000);
  const [years, setYears] = useState<number>(payload?.years ?? 10);

  const result: CagrResult = useMemo(() => {
    return calculateCagr({
      initialValue,
      finalValue,
      years
    });
  }, [initialValue, finalValue, years]);

  // SVG Chart bounds
  const schedule = result.yearlySchedule;
  const maxVal = Math.max(initialValue, finalValue) * 1.1 || 10000;
  const width = 500;
  const height = 190;
  const pad = { top: 16, right: 20, bottom: 26, left: 50 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const getSvgX = (year: number) => pad.left + (years > 0 ? (year / years) * plotW : 0);
  const getSvgY = (val: number) => pad.top + plotH - (Math.max(0, val) / maxVal) * plotH;

  const pointsString = schedule.map(pt => `${getSvgX(pt.year)},${getSvgY(pt.balance)}`).join(' ');
  const areaString = `${pad.left},${getSvgY(schedule[0]?.balance ?? initialValue)} ${pointsString} ${getSvgX(years)},${pad.top + plotH} ${pad.left},${pad.top + plotH}`;

  return (
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-graphite-card p-4 space-y-4 my-2 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono font-medium uppercase tracking-wider text-graphite-lightText dark:text-graphite-text">
            {payload?.title ?? 'Geometric Growth (CAGR) Projection'}
          </span>
        </div>
        <div className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tabular">
          HORIZON: {years} YRS
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono tabular">
        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Annualized Return (CAGR)</div>
          <div className={`text-base font-semibold mt-0.5 ${
            result.cagr >= 0 ? 'text-primary' : 'text-semantic-negativeLight dark:text-semantic-negative'
          }`}>
            {result.cagr >= 0 ? `+${result.cagr}%` : `${result.cagr}%`}
          </div>
        </div>

        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Total Multiple</div>
          <div className="text-base font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">
            {(finalValue / Math.max(1, initialValue)).toFixed(2)}x
          </div>
        </div>

        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Total Capital Gain</div>
          <div className={`text-base font-semibold mt-0.5 ${
            result.totalGain < 0
              ? 'text-semantic-negativeLight dark:text-semantic-negative'
              : 'text-graphite-lightText dark:text-graphite-text'
          }`}>
            {result.totalGain < 0
              ? `-$${Math.abs(result.totalGain).toLocaleString()}`
              : `$${result.totalGain.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* SVG Curve */}
      <div className="p-2 rounded-lg bg-graphite-lightRaised/60 dark:bg-graphite-raised/60">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5f14" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#ff5f14" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((step, i) => {
            const yVal = step * maxVal;
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
                  ${yVal >= 1000 ? `${(yVal / 1000).toFixed(0)}k` : yVal.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X ticks */}
          {Array.from(new Set([0, Math.round(years / 2), years])).map(yr => (
            <text
              key={`x-${yr}`}
              x={getSvgX(yr)}
              y={height - 6}
              textAnchor="middle"
              className="text-[9px] fill-graphite-lightMuted dark:fill-graphite-muted font-mono tabular"
            >
              Yr {yr}
            </text>
          ))}

          {/* Shaded Area */}
          <polygon points={areaString} fill={`url(#${gradId})`} />

          {/* Curve */}
          <polyline
            points={pointsString}
            fill="none"
            stroke="#ff5f14"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* End Point */}
          <circle
            cx={getSvgX(years)}
            cy={getSvgY(finalValue)}
            r="4.5"
            fill="#ff5f14"
            stroke="currentColor"
            className="text-white dark:text-graphite-card"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div>
          <div className="flex justify-between text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
            <span>Starting Value:</span>
            <span className="font-mono tabular text-graphite-lightText dark:text-graphite-text font-medium">
              ${initialValue.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={initialValue}
            aria-label="Initial portfolio value in dollars"
            onChange={(e) => setInitialValue(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
            <span>Target Value:</span>
            <span className="font-mono tabular text-graphite-lightText dark:text-graphite-text font-medium">
              ${finalValue.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="500000"
            step="1000"
            value={finalValue}
            aria-label="Final target portfolio value in dollars"
            onChange={(e) => setFinalValue(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
            <span>Horizon:</span>
            <span className="font-mono tabular text-graphite-lightText dark:text-graphite-text font-medium">
              {years} Years
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            step="1"
            value={years}
            aria-label="Investment horizon in years"
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
        <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted font-mono tabular">
          Form: ({finalValue.toLocaleString()} / {initialValue.toLocaleString()})^(1/{years}) - 1
        </div>

        <button
          type="button"
          onClick={() => {
            studio?.setCagrParams({ initialValue, finalValue, years });
            onNavigateTab?.('cagr-calculator');
          }}
          className="px-3 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-graphite-lightText dark:text-graphite-text font-medium text-xs transition-colors flex items-center gap-1"
        >
          <span>Open in CAGR Studio</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </button>
      </div>

    </div>
  );
};
