import React, { useState } from 'react';
import { calculateCagr, CagrResult } from '../services/calculatorEngine';
import { LineChart } from '../components/SimpleChart';

export const CagrCalculatorPage: React.FC = () => {
  const [initialValue, setInitialValue] = useState<number>(10000);
  const [finalValue, setFinalValue] = useState<number>(35000);
  const [years, setYears] = useState<number>(10);

  const result: CagrResult = calculateCagr({ initialValue, finalValue, years });

  const chartData = result.yearlySchedule.map(s => ({
    label: `Yr ${s.year}`,
    value: s.balance
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
          <span className="text-primary font-semibold">[TOOL.01]</span>
          <span>/</span>
          <span>GEOMETRIC MEAN COMPOUNDING</span>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-graphite-lightText dark:text-graphite-text">
          CAGR calculator
        </h1>
        <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
          Calculate the compound annual growth rate (geometric mean progression) of an asset over time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Inputs */}
        <div className="md:col-span-4 p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3.5">
          <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
            Variables
          </div>

          {/* Validation Alert */}
          {(years <= 0 || initialValue <= 0) && (
            <div role="alert" className="p-3 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20 text-semantic-warningLight dark:text-semantic-warning text-xs">
              {years <= 0 ? 'Time horizon must be greater than 0 years.' : 'Initial investment must be greater than $0.'}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label htmlFor="cagr-initial-value" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Initial investment ($)
              </label>
              <input
                id="cagr-initial-value"
                type="number"
                min="1"
                value={initialValue}
                onChange={(e) => setInitialValue(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
              />
            </div>

            <div>
              <label htmlFor="cagr-final-value" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Ending value ($)
              </label>
              <input
                id="cagr-final-value"
                type="number"
                min="0"
                value={finalValue}
                onChange={(e) => setFinalValue(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
              />
            </div>

            <div>
              <label htmlFor="cagr-years" className="block text-graphite-lightSecondary dark:text-graphite-secondary mb-1">
                Time horizon (years)
              </label>
              <input
                id="cagr-years"
                type="number"
                min="0.1"
                step="0.5"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-md bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text font-mono tabular"
              />
            </div>
          </div>
        </div>

        {/* Results & Chart */}
        <div className="md:col-span-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
              <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">CAGR</div>
              <div className="text-2xl font-mono font-medium text-primary tabular mt-1">{result.cagr}%</div>
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Annualized compound rate</div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
              <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Total capital gain</div>
              <div className="text-2xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">
                {result.totalGain >= 0 ? `$${result.totalGain.toLocaleString()}` : `-$${Math.abs(result.totalGain).toLocaleString()}`}
              </div>
              <div className={`text-[10px] font-mono tabular mt-0.5 ${
                result.totalReturnPercent >= 0
                  ? 'text-semantic-positiveLight dark:text-semantic-positive'
                  : 'text-semantic-negativeLight dark:text-semantic-negative'
              }`}>
                {result.totalReturnPercent >= 0 ? `+${result.totalReturnPercent}% net gain` : `${result.totalReturnPercent}% net loss`}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08]">
              <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Capital multiple</div>
              <div className="text-2xl font-mono font-medium text-graphite-lightText dark:text-graphite-text tabular mt-1">{(finalValue / Math.max(1, initialValue)).toFixed(2)}x</div>
              <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5">Over {years} years</div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
            <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Geometric compounding trajectory</div>
            <LineChart data={chartData} height={220} valuePrefix="$" seriesName="Compounding Trajectory" />
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] space-y-3">
        <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Annual progression schedule</div>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono tabular">
            <thead className="sticky top-0 bg-graphite-lightRaised dark:bg-graphite-raised text-graphite-lightMuted dark:text-graphite-muted border-b border-black/[0.08] dark:border-white/[0.08]">
              <tr>
                <th className="py-2 px-3 font-medium">Year</th>
                <th className="py-2 px-3 font-medium">Balance</th>
                <th className="py-2 px-3 font-medium">Annual Gain</th>
                <th className="py-2 px-3 font-medium">Total Return %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-graphite-lightSecondary dark:text-graphite-secondary">
              {result.yearlySchedule.map((row, idx) => {
                const annualGain = idx === 0 ? 0 : row.balance - result.yearlySchedule[idx - 1].balance;
                const totalRet = initialValue > 0 ? ((row.balance - initialValue) / initialValue) * 100 : 0;
                return (
                  <tr key={row.year} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-medium text-graphite-lightText dark:text-graphite-text">
                      {row.year === 0 ? '0 (Base)' : `Yr ${row.year}`}
                    </td>
                    <td className="py-2 px-3 font-medium text-graphite-lightText dark:text-graphite-text">
                      ${row.balance.toLocaleString()}
                    </td>
                    <td className={`py-2 px-3 ${
                      annualGain > 0
                        ? 'text-semantic-positiveLight dark:text-semantic-positive'
                        : annualGain < 0
                        ? 'text-semantic-negativeLight dark:text-semantic-negative'
                        : ''
                    }`}>
                      {annualGain > 0 ? `+$${annualGain.toLocaleString()}` : annualGain < 0 ? `-$${Math.abs(annualGain).toLocaleString()}` : '$0'}
                    </td>
                    <td className={`py-2 px-3 ${
                      totalRet > 0
                        ? 'text-semantic-positiveLight dark:text-semantic-positive'
                        : totalRet < 0
                        ? 'text-semantic-negativeLight dark:text-semantic-negative'
                        : ''
                    }`}>
                      {totalRet > 0 ? `+${totalRet.toFixed(2)}%` : totalRet < 0 ? `${totalRet.toFixed(2)}%` : '0.00%'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Note */}
      <div className="p-4 rounded-lg bg-graphite-lightRaised dark:bg-graphite-raised border border-black/[0.06] dark:border-white/[0.06] text-xs text-graphite-lightSecondary dark:text-graphite-secondary space-y-2">
        <div className="font-medium text-graphite-lightText dark:text-graphite-text">Formula</div>
        <p className="font-mono text-[11px] text-graphite-lightMuted dark:text-graphite-muted">
          CAGR = (Ending balance / Initial investment) ^ (1 / years) − 1
        </p>
        <div className="p-2.5 rounded bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] font-mono text-[11px] text-graphite-lightText dark:text-graphite-text">
          (${finalValue.toLocaleString()} / ${initialValue.toLocaleString()})^(1 / {years}) − 1 = {result.cagr}%
        </div>
      </div>
    </div>
  );
};
