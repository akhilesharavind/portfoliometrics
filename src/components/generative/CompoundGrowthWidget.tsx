import React, { useState, useMemo, useId } from 'react';
import { calculateCompoundInterest, CompoundInterestResult } from '../../services/calculatorEngine';
import { GenerativeWidgetProps, WidgetPayloadMap } from './types';
import { useOptionalStudioContext } from '../../context/StudioContext';
import { ExternalLink } from 'lucide-react';

const FREQUENCY_LABELS: Record<1 | 2 | 4 | 12 | 365, string> = {
  1: 'Annual',
  2: 'Semi-Annual',
  4: 'Quarterly',
  12: 'Monthly',
  365: 'Daily'
};

export const CompoundGrowthWidget: React.FC<GenerativeWidgetProps<WidgetPayloadMap['compound_growth']>> = ({
  payload,
  onNavigateTab
}) => {
  const uid = useId();
  const studio = useOptionalStudioContext();
  const interestGradId = `interestGrad-${uid}`;
  const principalGradId = `principalGrad-${uid}`;
  const freqSelectId = `comp-freq-${uid}`;

  const initialInvestment = payload?.initialInvestment ?? 10000;
  const [monthlyContribution, setMonthlyContribution] = useState<number>(payload?.monthlyContribution ?? 500);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(payload?.annualInterestRate ?? 7.0);
  const [years, setYears] = useState<number>(payload?.years ?? 15);
  const [compoundingFrequency, setCompoundingFrequency] = useState<1 | 2 | 4 | 12 | 365>(
    payload?.compoundingFrequency ?? 12
  );

  const result: CompoundInterestResult = useMemo(() => {
    return calculateCompoundInterest({
      initialInvestment,
      monthlyContribution,
      annualInterestRate,
      years,
      compoundingFrequency
    });
  }, [initialInvestment, monthlyContribution, annualInterestRate, years, compoundingFrequency]);

  // SVG Stacked Accumulation Chart
  const schedule = result.schedule;
  const maxVal = result.finalBalance * 1.1 || 10000;
  const width = 500;
  const height = 190;
  const pad = { top: 16, right: 20, bottom: 26, left: 54 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const getSvgX = (year: number) => pad.left + (years > 0 ? (year / years) * plotW : 0);
  const getSvgY = (val: number) => pad.top + plotH - (Math.max(0, val) / maxVal) * plotH;

  // Principal area (bottom)
  const principalPoints = schedule.map(pt => `${getSvgX(pt.year)},${getSvgY(pt.principal)}`);
  const principalArea = `${pad.left},${getSvgY(initialInvestment)} ${principalPoints.join(' ')} ${getSvgX(years)},${pad.top + plotH} ${pad.left},${pad.top + plotH}`;

  // Total balance line (top)
  const balancePoints = schedule.map(pt => `${getSvgX(pt.year)},${getSvgY(pt.totalBalance)}`);
  const totalArea = `${pad.left},${getSvgY(initialInvestment)} ${balancePoints.join(' ')} ${getSvgX(years)},${pad.top + plotH} ${pad.left},${pad.top + plotH}`;

  const freqLabel = FREQUENCY_LABELS[compoundingFrequency] ?? 'Monthly';

  return (
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-graphite-card p-4 space-y-4 my-2 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono font-medium uppercase tracking-wider text-graphite-lightText dark:text-graphite-text">
            {payload?.title ?? 'Compound Accumulation Model'}
          </span>
        </div>
        <div className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tabular">
          HORIZON: {years} YRS
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono tabular">
        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Ending Balance</div>
          <div className="text-base font-semibold text-primary mt-0.5">
            ${result.finalBalance.toLocaleString()}
          </div>
        </div>

        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Total Principal Deposited</div>
          <div className="text-base font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">
            ${result.totalPrincipal.toLocaleString()}
          </div>
        </div>

        <div className="p-2 rounded bg-graphite-lightRaised dark:bg-graphite-raised">
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Interest Earned</div>
          <div className={`text-base font-semibold mt-0.5 ${
            result.totalInterest < 0
              ? 'text-semantic-negativeLight dark:text-semantic-negative'
              : 'text-semantic-positiveLight dark:text-semantic-positive'
          }`}>
            {result.totalInterest < 0
              ? `-$${Math.abs(result.totalInterest).toLocaleString()}`
              : `$${result.totalInterest.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Two-tone SVG Accumulation Chart */}
      <div className="p-2 rounded-lg bg-graphite-lightRaised/60 dark:bg-graphite-raised/60">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          <defs>
            <linearGradient id={interestGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5f14" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ff5f14" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id={principalGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#969696" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#969696" stopOpacity="0.05" />
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
                  ${yVal >= 1000000 ? `${(yVal / 1000000).toFixed(1)}M` : `${(yVal / 1000).toFixed(0)}k`}
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

          {/* Total Balance Area (Interest) */}
          <polygon points={totalArea} fill={`url(#${interestGradId})`} />

          {/* Principal Area */}
          <polygon points={principalArea} fill={`url(#${principalGradId})`} />

          {/* Principal Line */}
          <polyline
            points={principalPoints.join(' ')}
            fill="none"
            stroke="#969696"
            strokeWidth="1.6"
            strokeDasharray="3 3"
          />

          {/* Total Balance Line */}
          <polyline
            points={balancePoints.join(' ')}
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
            <span>Total Value (Principal + Interest)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-[#969696] inline-block" />
            <span>Deposited Principal</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <div className="flex justify-between text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
            <span>Monthly Deposit:</span>
            <span className="font-mono tabular text-graphite-lightText dark:text-graphite-text font-medium">
              ${monthlyContribution.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="3000"
            step="50"
            value={monthlyContribution}
            aria-label="Monthly deposit amount in dollars"
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
            <span>Annual Interest Rate:</span>
            <span className="font-mono tabular text-graphite-lightText dark:text-graphite-text font-medium">
              {annualInterestRate}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="0.25"
            value={annualInterestRate}
            aria-label="Annual interest rate percentage"
            onChange={(e) => setAnnualInterestRate(Number(e.target.value))}
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
            max="50"
            step="1"
            value={years}
            aria-label="Compounding horizon in years"
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5"
          />
        </div>

        <div>
          <label
            htmlFor={freqSelectId}
            className="block text-[11px] text-graphite-lightSecondary dark:text-graphite-secondary mb-1"
          >
            Compounding Frequency:
          </label>
          <select
            id={freqSelectId}
            value={compoundingFrequency}
            onChange={(e) => setCompoundingFrequency(Number(e.target.value) as 1 | 2 | 4 | 12 | 365)}
            className="w-full text-[11px] px-2 py-1.5 rounded bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] font-mono text-graphite-lightText dark:text-graphite-text"
          >
            <option value={1}>Annual (1/yr)</option>
            <option value={2}>Semi-Annual (2/yr)</option>
            <option value={4}>Quarterly (4/yr)</option>
            <option value={12}>Monthly (12/yr)</option>
            <option value={365}>Daily (365/yr)</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
        <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted font-mono tabular">
          {freqLabel} Compound Growth Rate
        </div>

        <button
          type="button"
          onClick={() => {
            studio?.setCompoundParams({
              initialInvestment,
              monthlyContribution,
              annualInterestRate,
              years,
              compoundingFrequency
            });
            onNavigateTab?.('compound-interest');
          }}
          className="px-3 py-1.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.09] text-graphite-lightText dark:text-graphite-text font-medium text-xs transition-colors flex items-center gap-1"
        >
          <span>Open in Compound Studio</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </button>
      </div>

    </div>
  );
};
