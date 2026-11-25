import React, { useState, useEffect } from 'react';
import { calculateCompoundInterest, CompoundInterestResult } from '../services/calculatorEngine';
import { LineChart } from '../components/SimpleChart';
import { useOptionalStudioContext } from '../context/StudioContext';

export const CompoundInterestPage: React.FC = () => {
  const studio = useOptionalStudioContext();
  const handoff = studio?.compoundParams;
  const [initialInvestment, setInitialInvestment] = useState<number>(handoff?.initialInvestment ?? 10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(handoff?.monthlyContribution ?? 500);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(handoff?.annualInterestRate ?? 8.0);
  const [years, setYears] = useState<number>(handoff?.years ?? 20);
  const [compoundingFrequency, setCompoundingFrequency] = useState<1 | 2 | 4 | 12 | 365>(handoff?.compoundingFrequency ?? 12);
  const [depositTiming, setDepositTiming] = useState<'beginning' | 'end'>('end');

  useEffect(() => {
    if (!handoff) return;
    if (handoff.initialInvestment !== undefined) setInitialInvestment(handoff.initialInvestment);
    if (handoff.monthlyContribution !== undefined) setMonthlyContribution(handoff.monthlyContribution);
    if (handoff.annualInterestRate !== undefined) setAnnualInterestRate(handoff.annualInterestRate);
    if (handoff.years !== undefined) setYears(handoff.years);
    if (handoff.compoundingFrequency !== undefined) setCompoundingFrequency(handoff.compoundingFrequency);
  }, [handoff]);

  const result: CompoundInterestResult = calculateCompoundInterest({
    initialInvestment,
    monthlyContribution,
    annualInterestRate,
    years,
    compoundingFrequency,
    depositTiming
  });

  const chartData = result.schedule.map(s => ({
    label: `Yr ${s.year}`,
    value: s.totalBalance,
    benchmark: s.principal
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
          <span className="text-primary font-semibold">[TOOL.02]</span>
          <span>/</span>
          <span>SCHEDULE ACCUMULATION</span>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-graphite-lightText dark:text-graphite-text">
          Compound interest calculator
        </h1>
        <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
          Simulate long-term capital accumulation with periodic monthly contributions and reinvested compounding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Inputs */}
        <div className="md:col-span-4 p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3.5">
          <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
            Variables
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label htmlFor="ci-initial-investment" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Starting capital ($)
              </label>
              <input
                id="ci-initial-investment"
                type="number"
                min="0"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
              />
            </div>

            <div>
              <label htmlFor="ci-monthly-contribution" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Monthly contribution ($)
              </label>
              <input
                id="ci-monthly-contribution"
                type="number"
                min="0"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
              />
            </div>

            <div>
              <label htmlFor="ci-annual-rate" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Expected annual rate (%/year)
              </label>
              <input
                id="ci-annual-rate"
                type="number"
                min="-99"
                step="0.1"
                value={annualInterestRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAnnualInterestRate(Number.isFinite(val) ? Math.max(-99, val) : 0);
                }}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="ci-horizon-years" className="block text-graphite-lightSecondary dark:text-graphite-secondary">
                  Horizon (years)
                </label>
                <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
                  1 – 100 yrs
                </span>
              </div>
              <input
                id="ci-horizon-years"
                type="number"
                min="1"
                max="100"
                step="any"
                value={years}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setYears(Number.isFinite(val) ? Math.min(100, Math.max(1, val)) : 1);
                }}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[5, 10, 15, 20, 25, 30, 40].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setYears(preset)}
                    className={`min-h-[44px] sm:min-h-0 px-2.5 py-1.5 sm:px-2 sm:py-0.5 text-[10px] rounded font-mono transition-colors ${
                      years === preset
                        ? 'bg-primary text-white font-medium'
                        : 'bg-black/[0.04] dark:bg-white/[0.04] text-graphite-lightSecondary dark:text-graphite-secondary hover:bg-black/[0.08] dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {preset}y
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="ci-compounding-frequency" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Compounding frequency
              </label>
              <select
                id="ci-compounding-frequency"
                value={compoundingFrequency}
                onChange={(e) => setCompoundingFrequency(Number(e.target.value) as 1 | 2 | 4 | 12 | 365)}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text text-xs"
              >
                <option value={1}>Annual (1/yr)</option>
                <option value={2}>Semi-Annual (2/yr)</option>
                <option value={4}>Quarterly (4/yr)</option>
                <option value={12}>Monthly (12/yr)</option>
                <option value={365}>Daily (365/yr)</option>
              </select>
            </div>

            <div>
              <label htmlFor="ci-deposit-timing" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Contribution timing
              </label>
              <select
                id="ci-deposit-timing"
                value={depositTiming}
                onChange={(e) => setDepositTiming(e.target.value as 'beginning' | 'end')}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text text-xs"
              >
                <option value="end">End of month (Ordinary Annuity)</option>
                <option value="beginning">Beginning of month (Annuity Due)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results & Chart */}
        <div className="md:col-span-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
              <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Ending balance</div>
              <div className="text-2xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
                ${result.finalBalance.toLocaleString()}
              </div>
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">After {years} years</div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
              <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Total deposited</div>
              <div className="text-2xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
                ${result.totalPrincipal.toLocaleString()}
              </div>
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Out-of-pocket capital</div>
            </div>

            {(() => {
              const netTotalInterest =
                result.finalBalance < result.totalPrincipal
                  ? result.finalBalance - result.totalPrincipal
                  : result.totalInterest;
              return (
                <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
                  <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Interest compounded</div>
                  <div className={`text-2xl font-mono font-medium tabular mt-1 ${
                    netTotalInterest < 0
                      ? 'text-semantic-negativeLight dark:text-semantic-negative'
                      : 'text-primary'
                  }`}>
                    {netTotalInterest < 0
                      ? `-$${Math.abs(netTotalInterest).toLocaleString()}`
                      : `$${netTotalInterest.toLocaleString()}`}
                  </div>
                  <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5 font-mono tabular">
                    {netTotalInterest < 0
                      ? `${((netTotalInterest / Math.max(1, result.totalPrincipal)) * 100).toFixed(0)}% net capital loss`
                      : `${result.finalBalance > 0 ? ((netTotalInterest / result.finalBalance) * 100).toFixed(0) : 0}% of ending wealth`}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
            <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Capital trajectory</div>
            <LineChart
              data={chartData}
              height={220}
              valuePrefix="$"
              seriesName="Total Balance"
              benchmarkName="Principal Invested"
            />
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
        <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Annual accumulation schedule</div>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono tabular">
            <thead className="sticky top-0 bg-graphite-lightRaised dark:bg-graphite-raised text-graphite-lightMuted dark:text-graphite-muted border-b border-black/[0.08] dark:border-white/[0.08]">
              <tr>
                <th className="py-2 px-3 font-medium">Year</th>
                <th className="py-2 px-3 font-medium">Deposited</th>
                <th className="py-2 px-3 font-medium">Interest accrued</th>
                <th className="py-2 px-3 font-medium">Ending balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-graphite-lightSecondary dark:text-graphite-secondary">
              {result.schedule.map(row => {
                const netInterest =
                  row.totalBalance < row.principal
                    ? row.totalBalance - row.principal
                    : row.interestEarned;
                return (
                  <tr key={row.year} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-medium text-graphite-lightText dark:text-graphite-text">{row.year}</td>
                    <td className="py-2 px-3">${row.principal.toLocaleString()}</td>
                    <td className={`py-2 px-3 ${
                      netInterest > 0
                        ? 'text-semantic-positiveLight dark:text-semantic-positive'
                        : netInterest < 0
                        ? 'text-semantic-negativeLight dark:text-semantic-negative'
                        : 'text-graphite-lightMuted dark:text-graphite-muted'
                    }`}>
                      {netInterest > 0
                        ? `+$${netInterest.toLocaleString()}`
                        : netInterest < 0
                        ? `-$${Math.abs(netInterest).toLocaleString()}`
                        : '$0'}
                    </td>
                    <td className="py-2 px-3 font-medium text-graphite-lightText dark:text-graphite-text">${row.totalBalance.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
