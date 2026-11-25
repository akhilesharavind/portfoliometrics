import React, { useState } from 'react';
import { POPULAR_PORTFOLIOS } from '../data/popularPortfolios';
import { useOptionalStudioContext } from '../context/StudioContext';

interface PopularPortfoliosPageProps {
  onSelectPortfolio: (allocations: { symbol: string; weight: number }[]) => void;
}

export const PopularPortfoliosPage: React.FC<PopularPortfoliosPageProps> = ({ onSelectPortfolio }) => {
  const studio = useOptionalStudioContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Classic', 'All-Weather', 'Growth', 'Income'];

  const filteredPortfolios = selectedCategory === 'All'
    ? POPULAR_PORTFOLIOS
    : POPULAR_PORTFOLIOS.filter(p => p.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-graphite-lightMuted dark:text-graphite-muted">
          <span className="text-primary font-semibold">[BENCHMARKS]</span>
          <span>/</span>
          <span>CLASSIC MULTI-ASSET ARCHITECTURES</span>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-graphite-lightText dark:text-graphite-text">
          Popular portfolios
        </h1>
        <p className="text-xs text-graphite-lightSecondary dark:text-graphite-secondary">
          Historical asset allocations developed by investment researchers and multi-asset institutions.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            aria-pressed={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[44px] inline-flex items-center text-xs px-3.5 py-2 rounded-md font-medium transition-colors shrink-0 ${
              selectedCategory === cat
                ? 'bg-black/[0.08] dark:bg-white/[0.1] text-graphite-lightText dark:text-graphite-text'
                : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Portfolios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPortfolios.map((portfolio) => (
          <div
            key={portfolio.id}
            className="flex flex-col justify-between p-5 rounded-xl bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.2] dark:hover:border-white/[0.2] transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-lightMuted dark:text-graphite-muted">
                  {portfolio.category}
                </span>
                <span className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted font-mono tabular">10-year metrics</span>
              </div>

              <h2 className="text-sm font-medium text-graphite-lightText dark:text-graphite-text">
                {portfolio.name}
              </h2>
              <p className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted mt-0.5 mb-2">
                {portfolio.tagline}
              </p>
              <p className="text-xs leading-relaxed text-graphite-lightSecondary dark:text-graphite-secondary mb-4 line-clamp-2">
                {portfolio.description}
              </p>

              {/* Asset Chips */}
              <div className="space-y-1 mb-5">
                <div className="flex flex-wrap gap-1">
                  {portfolio.allocations.map((a, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-[4px] bg-black/[0.03] dark:bg-white/[0.04] text-graphite-lightSecondary dark:text-graphite-secondary font-mono tabular"
                    >
                      <strong className="text-graphite-lightText dark:text-graphite-text font-medium">{a.symbol}</strong> {a.weight}%
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics & Action Button */}
            <div>
              <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-black/[0.06] dark:border-white/[0.06] text-center font-mono tabular mb-3">
                <div>
                  <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">10Y CAGR</div>
                  <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">
                    {portfolio.cagr10Y >= 0 ? `+${portfolio.cagr10Y}%` : `${portfolio.cagr10Y}%`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Sharpe</div>
                  <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">{portfolio.sharpeRatio}</div>
                </div>
                <div>
                  <div className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">Max DD</div>
                  <div className="text-xs font-medium text-semantic-negativeLight dark:text-semantic-negative">{portfolio.maxDrawdown}%</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  studio?.setBacktestParams({
                    initialValue: 10000,
                    startYear: 2016,
                    endYear: 2025,
                    cashFlowType: 'none',
                    cashFlowAmount: 0,
                    benchmark: 'SPY'
                  });
                  onSelectPortfolio(portfolio.allocations.map(a => ({ symbol: a.symbol, weight: a.weight })));
                }}
                className="w-full py-2.5 px-3 rounded-md bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-graphite-lightText dark:text-graphite-text text-xs font-medium transition-colors min-h-[44px]"
              >
                Simulate in Backtester (2016-2025)
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
