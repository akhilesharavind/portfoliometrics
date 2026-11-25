import React, { useMemo, useState } from 'react';
import { WidgetType, WidgetPayloadMap } from './types';
import { BacktestScenarioWidget } from './BacktestScenarioWidget';
import { MptFrontierWidget } from './MptFrontierWidget';
import { MonteCarloFanWidget } from './MonteCarloFanWidget';
import { CagrProjectionWidget } from './CagrProjectionWidget';
import { CompoundGrowthWidget } from './CompoundGrowthWidget';
import { runBacktest, AllocationItem } from '../../services/backtestingEngine';
import { Sliders, Check, ExternalLink } from 'lucide-react';

export interface GenerativeWidgetRendererProps {
  widgetType: WidgetType;
  payload: any;
  onApplyToWorkspace?: (allocations: { symbol: string; weight: number }[]) => void;
  onNavigateTab?: (tab: string) => void;
}

const PortfolioComparisonView: React.FC<{
  payload: WidgetPayloadMap['portfolio_comparison'];
  onApplyToWorkspace?: (allocations: { symbol: string; weight: number }[]) => void;
  onNavigateTab?: (tab: string) => void;
}> = ({ payload, onApplyToWorkspace, onNavigateTab }) => {
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const portfolios = useMemo(
    () => (Array.isArray(payload.portfolios) ? payload.portfolios : []),
    [payload.portfolios]
  );
  const startYear = payload.startYear ?? 2015;
  const endYear = payload.endYear ?? 2025;
  const initialValue = payload.initialValue ?? 10000;
  const benchmark = payload.benchmark ?? 'SPY';

  const evaluated = useMemo(() => {
    return portfolios.map((portfolio, idx) => {
      const allocs: AllocationItem[] =
        Array.isArray(portfolio?.allocations) && portfolio.allocations.length > 0
          ? portfolio.allocations.map(a => ({ symbol: a.symbol, weight: a.weight }))
          : [{ symbol: 'VTI', weight: 100 }];

      const result = runBacktest({
        allocations: allocs,
        initialValue,
        cashFlowType: 'none',
        cashFlowAmount: 0,
        startYear,
        endYear,
        rebalancing: 'annually',
        benchmark,
        riskFreeRate: 0.04
      });

      return {
        id: portfolio?.id || `portfolio-${idx}`,
        name: portfolio?.name || `Strategy ${idx + 1}`,
        allocations: allocs,
        result
      };
    });
  }, [portfolios, initialValue, startYear, endYear, benchmark]);

  if (evaluated.length === 0) return null;

  const handleApply = (id: string, allocations: AllocationItem[]) => {
    if (onApplyToWorkspace) {
      onApplyToWorkspace(allocations);
      setAppliedId(id);
      setTimeout(() => setAppliedId(prev => (prev === id ? null : prev)), 2500);
    }
  };

  const handleOpen = (allocations: AllocationItem[]) => {
    if (onApplyToWorkspace) {
      onApplyToWorkspace(allocations);
    }
    onNavigateTab?.('backtesting');
  };

  return (
    <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-graphite-card p-4 space-y-4 my-2 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono font-medium uppercase tracking-wider text-graphite-lightText dark:text-graphite-text">
            {payload.title || 'Portfolio Strategy Comparison'}
          </span>
          <span className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
            [{evaluated.length} Portfolios · {startYear}-{endYear}]
          </span>
        </div>
        <div className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted tabular">
          CALC: &lt;1ms
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evaluated.map((item) => {
          const isApplied = appliedId === item.id;
          return (
            <div
              key={item.id}
              className="p-3.5 rounded-lg bg-graphite-lightRaised/60 dark:bg-graphite-raised/60 border border-black/[0.06] dark:border-white/[0.06] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-graphite-lightText dark:text-graphite-text truncate">
                    {item.name}
                  </span>
                  <span className="font-mono tabular text-primary font-semibold whitespace-nowrap">
                    ${item.result.finalValue.toLocaleString()}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted truncate">
                  {item.allocations.map(a => `${a.symbol} ${a.weight}%`).join(' · ')}
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center font-mono tabular pt-1">
                  <div className="p-1.5 rounded bg-white dark:bg-graphite-card">
                    <div className="text-[9px] text-graphite-lightMuted dark:text-graphite-muted">CAGR</div>
                    <div className="font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">
                      {item.result.cagr}%
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-graphite-card">
                    <div className="text-[9px] text-graphite-lightMuted dark:text-graphite-muted">Vol</div>
                    <div className="font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">
                      {item.result.volatility}%
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-graphite-card">
                    <div className="text-[9px] text-graphite-lightMuted dark:text-graphite-muted">Sharpe</div>
                    <div className="font-semibold text-graphite-lightText dark:text-graphite-text mt-0.5">
                      {item.result.sharpeRatio}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-graphite-card">
                    <div className="text-[9px] text-graphite-lightMuted dark:text-graphite-muted">Max DD</div>
                    <div className="font-semibold text-semantic-negativeLight dark:text-semantic-negative mt-0.5">
                      {item.result.maxDrawdown}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => handleApply(item.id, item.allocations)}
                  className="flex-1 min-h-[44px] px-2.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-[11px] transition-colors flex items-center justify-center gap-1"
                >
                  {isApplied ? (
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
                  onClick={() => handleOpen(item.allocations)}
                  className="min-h-[44px] px-2.5 py-1.5 rounded-md bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] hover:border-primary text-graphite-lightText dark:text-graphite-text font-medium text-[11px] transition-colors flex items-center justify-center gap-1"
                >
                  <span>Backtester</span>
                  <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const GenerativeWidgetRenderer: React.FC<GenerativeWidgetRendererProps> = ({
  widgetType,
  payload,
  onApplyToWorkspace,
  onNavigateTab
}) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  switch (widgetType) {
    case 'backtest_scenario':
      return (
        <BacktestScenarioWidget
          payload={payload as WidgetPayloadMap['backtest_scenario']}
          onApplyToWorkspace={onApplyToWorkspace}
          onNavigateTab={onNavigateTab}
        />
      );

    case 'mpt_frontier':
      return (
        <MptFrontierWidget
          payload={payload as WidgetPayloadMap['mpt_frontier']}
          onApplyToWorkspace={onApplyToWorkspace}
          onNavigateTab={onNavigateTab}
        />
      );

    case 'monte_carlo_fan':
      return (
        <MonteCarloFanWidget
          payload={payload as WidgetPayloadMap['monte_carlo_fan']}
          onApplyToWorkspace={onApplyToWorkspace}
          onNavigateTab={onNavigateTab}
        />
      );

    case 'cagr_projection':
      return (
        <CagrProjectionWidget
          payload={payload as WidgetPayloadMap['cagr_projection']}
          onApplyToWorkspace={onApplyToWorkspace}
          onNavigateTab={onNavigateTab}
        />
      );

    case 'compound_growth':
      return (
        <CompoundGrowthWidget
          payload={payload as WidgetPayloadMap['compound_growth']}
          onApplyToWorkspace={onApplyToWorkspace}
          onNavigateTab={onNavigateTab}
        />
      );

    case 'portfolio_comparison':
      if (!Array.isArray(payload.portfolios) || payload.portfolios.length === 0) {
        return null;
      }
      return (
        <PortfolioComparisonView
          payload={payload as WidgetPayloadMap['portfolio_comparison']}
          onApplyToWorkspace={onApplyToWorkspace}
          onNavigateTab={onNavigateTab}
        />
      );

    default:
      return null;
  }
};
