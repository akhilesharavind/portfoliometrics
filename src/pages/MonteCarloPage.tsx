import React, { useState, useMemo, useEffect } from 'react';
import { runMonteCarloSimulation, MonteCarloResult } from '../services/monteCarloEngine';
import { useOptionalStudioContext } from '../context/StudioContext';

export const MonteCarloPage: React.FC = () => {
  const studio = useOptionalStudioContext();
  const handoff = studio?.monteCarloParams;
  const simCount = studio?.activePlan === 'Pro' || studio?.activePlan === 'Institutional' ? 5000 : 1000;

  const [initialInvestment, setInitialInvestment] = useState<number>(handoff?.initialInvestment ?? 500000);
  const [expectedAnnualReturn, setExpectedAnnualReturn] = useState<number>(handoff?.expectedAnnualReturn ?? 8.5);
  const [annualVolatility, setAnnualVolatility] = useState<number>(handoff?.annualVolatility ?? 14.0);
  const [annualWithdrawal, setAnnualWithdrawal] = useState<number>(handoff?.annualWithdrawal ?? 20000);
  const [inflationRate, setInflationRate] = useState<number>(handoff?.inflationRate ?? 2.5);
  const [years, setYears] = useState<number>(handoff?.years ?? 30);

  useEffect(() => {
    if (!handoff) return;
    if (handoff.initialInvestment !== undefined) setInitialInvestment(handoff.initialInvestment);
    if (handoff.expectedAnnualReturn !== undefined) setExpectedAnnualReturn(handoff.expectedAnnualReturn);
    if (handoff.annualVolatility !== undefined) setAnnualVolatility(handoff.annualVolatility);
    if (handoff.annualWithdrawal !== undefined) setAnnualWithdrawal(handoff.annualWithdrawal);
    if (handoff.inflationRate !== undefined) setInflationRate(handoff.inflationRate);
    if (handoff.years !== undefined) setYears(handoff.years);
  }, [handoff]);

  const [simSeedOffset, setSimSeedOffset] = useState<number>(0);

  const result: MonteCarloResult = useMemo(() => {
    void simSeedOffset;
    return runMonteCarloSimulation({
      initialInvestment,
      expectedAnnualReturn,
      annualVolatility,
      annualWithdrawal,
      inflationRate,
      years,
      simulationsCount: simCount
    });
  }, [initialInvestment, expectedAnnualReturn, annualVolatility, annualWithdrawal, inflationRate, years, simCount, simSeedOffset]);

  const handleSimulate = () => {
    setSimSeedOffset(prev => prev + 1);
  };

  const pts = result.percentilesByYear;
  const maxVal = Math.max(...pts.map(p => p.p90)) * 1.05 || 1;
  const width = 800;
  const height = 300;
  const pad = { top: 20, right: 24, bottom: 36, left: 60 };
  const getX = (yr: number) => pad.left + (yr / years) * (width - pad.left - pad.right);
  const getY = (val: number) => pad.top + (height - pad.top - pad.bottom) - (val / maxVal) * (height - pad.top - pad.bottom);

  const p90Path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.p90)}`).join(' ');
  const p75Path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.p75)}`).join(' ');
  const p50Path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.p50)}`).join(' ');
  const p25Path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.p25)}`).join(' ');
  const p10Path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.p10)}`).join(' ');

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
          <span className="text-primary font-semibold">[SYS.03]</span>
          <span>/</span>
          <span>STOCHASTIC PATH METROLOGY</span>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-graphite-lightText dark:text-graphite-text">
          Monte Carlo simulation
        </h1>
        <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
          {simCount.toLocaleString()} stochastic geometric Brownian paths under inflation-adjusted cash withdrawal schedules ({studio?.activePlan === 'Pro' || studio?.activePlan === 'Institutional' ? `${studio.activePlan} tier` : 'Free tier: 1,000 trials'}).
        </p>
      </div>

      {/* Inputs Grid */}
      <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-4">
        <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          Simulation variables
        </div>

        {/* Validation Alert */}
        {initialInvestment <= 0 && (
          <div role="alert" className="p-3 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warning text-xs">
            Starting capital must be greater than $0 to model portfolio survival.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label htmlFor="mc-initial-investment" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
              Starting capital ($)
            </label>
            <input
              id="mc-initial-investment"
              type="number"
              min="1000"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
            />
          </div>

          <div>
            <label htmlFor="mc-expected-return" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
              Expected return (%/year)
            </label>
            <input
              id="mc-expected-return"
              type="number"
              step="0.1"
              value={expectedAnnualReturn}
              onChange={(e) => setExpectedAnnualReturn(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
            />
          </div>

          <div>
            <label htmlFor="mc-annual-volatility" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
              Annual volatility (% σ)
            </label>
            <input
              id="mc-annual-volatility"
              type="number"
              step="0.1"
              value={annualVolatility}
              onChange={(e) => setAnnualVolatility(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
            />
          </div>

          <div>
            <label htmlFor="mc-annual-withdrawal" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
              Annual withdrawal ($)
            </label>
            <input
              id="mc-annual-withdrawal"
              type="number"
              min="0"
              value={annualWithdrawal}
              onChange={(e) => setAnnualWithdrawal(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
            />
          </div>

          <div>
            <label htmlFor="mc-inflation-rate" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
              Inflation rate (%)
            </label>
            <input
              id="mc-inflation-rate"
              type="number"
              step="0.1"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
            />
          </div>

          <div>
            <label htmlFor="mc-horizon-years" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
              Horizon
            </label>
            <select
              id="mc-horizon-years"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text"
            >
              {[10, 15, 20, 25, 30, 40].map(y => (
                <option key={y} value={y}>{y} years</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
            Active compute: {simCount.toLocaleString()} trials ({studio?.activePlan ?? 'Free'})
          </span>
          <button
            type="button"
            disabled={initialInvestment <= 0}
            onClick={handleSimulate}
            className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-medium transition-colors"
          >
            <span>Run {simCount.toLocaleString()} simulations</span>
          </button>
        </div>
      </div>

      {/* KPI Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Survival probability</div>
          <div className="text-xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
            {result.probabilityOfSuccess}%
          </div>
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Paths ending balance &gt; $0</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Median ending balance (50th)</div>
          <div className="text-xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
            ${result.medianFinalBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Central expectation</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Optimistic (90th percentile)</div>
          <div className="text-xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
            ${result.p90FinalBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Upper decile market sequence</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Stress (10th percentile)</div>
          <div className="text-xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
            ${result.p10FinalBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Adverse market sequence</div>
        </div>
      </div>

      {/* Fan Chart */}
      <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Percentile path envelopes</div>
          <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Median (50th %ile) with 10th-90th percentile bands</div>
        </div>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" style={{ minWidth: 480 }}>
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
              const val = t * maxVal;
              return (
                <g key={idx}>
                  <line x1={pad.left} y1={getY(val)} x2={width - pad.right} y2={getY(val)} stroke="currentColor" className="text-black/[0.06] dark:text-white/[0.06]" strokeDasharray="2 3" />
                  <text x={pad.left - 8} y={getY(val) + 3} textAnchor="end" className="text-[10px] fill-graphite-lightMuted dark:fill-graphite-muted font-mono tabular">
                    ${val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                  </text>
                </g>
              );
            })}

            {/* X-axis */}
            {[0, 5, 10, 15, 20, 25, 30, 35, 40].filter(y => y <= years).map(y => (
              <text key={y} x={getX(y)} y={height - 12} textAnchor="middle" className="text-[10px] fill-graphite-lightMuted dark:fill-graphite-muted font-mono tabular">
                Yr {y}
              </text>
            ))}

            {/* Monochromatic / disciplined Percentile Lines */}
            <path d={p90Path} fill="none" stroke="currentColor" className="text-black/30 dark:text-white/30" strokeWidth="1" strokeDasharray="3 3" />
            <path d={p75Path} fill="none" stroke="currentColor" className="text-black/40 dark:text-white/40" strokeWidth="1" />
            <path d={p50Path} fill="none" stroke="#ff5f14" strokeWidth="2" />
            <path d={p25Path} fill="none" stroke="currentColor" className="text-black/40 dark:text-white/40" strokeWidth="1" />
            <path d={p10Path} fill="none" stroke="currentColor" className="text-black/30 dark:text-white/30" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 border-t border-dashed border-black/40 dark:border-white/40"></span><span>90th &amp; 10th</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-black/40 dark:bg-white/40"></span><span>75th &amp; 25th</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-primary"></span><span className="font-medium text-graphite-lightText dark:text-graphite-text">Median (50th %ile)</span></div>
        </div>
      </div>

    </div>
  );
};
