import React from 'react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-graphite-lightBg dark:bg-graphite-bg border-t border-black/[0.08] dark:border-white/[0.08] text-graphite-lightSecondary dark:text-graphite-secondary mt-24 text-xs">
      
      {/* Main Links */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Brand Info */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-[3px] bg-primary flex items-center justify-center text-white font-mono text-[11px] font-bold">
                P
              </div>
              <span className="text-sm font-semibold tracking-tight text-graphite-lightText dark:text-graphite-text">PORTFOLIOMETRICS</span>
            </div>
            <p className="text-xs leading-relaxed text-graphite-lightMuted dark:text-graphite-muted max-w-sm">
              Precision quantitative portfolio engineering studio. Historical return distributions, covariance matrices, and stochastic Brownian paths modeled across 16 years of multi-asset market data (2010-2025).
            </p>
            <div className="text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted pt-1">
              [RUNTIME: IN-BROWSER QUANT ENGINE]
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="font-medium text-graphite-lightText dark:text-graphite-text mb-3">Products</div>
            <ul className="space-y-1 sm:space-y-2">
              <li><button type="button" onClick={() => onSelectTab('backtesting')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">Portfolio backtesting</button></li>
              <li><button type="button" onClick={() => onSelectTab('optimization')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">Portfolio optimization</button></li>
              <li><button type="button" onClick={() => onSelectTab('monte-carlo')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">Monte Carlo simulation</button></li>
              <li><button type="button" onClick={() => onSelectTab('ai-assistant')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">AI assistant</button></li>
              <li><button type="button" onClick={() => onSelectTab('pricing')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">Pricing</button></li>
            </ul>
          </div>

          {/* Calculators & Presets */}
          <div>
            <div className="font-medium text-graphite-lightText dark:text-graphite-text mb-3">Calculators</div>
            <ul className="space-y-1 sm:space-y-2">
              <li><button type="button" onClick={() => onSelectTab('cagr-calculator')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">CAGR calculator</button></li>
              <li><button type="button" onClick={() => onSelectTab('compound-interest')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">Compound interest</button></li>
              <li><button type="button" onClick={() => onSelectTab('popular-portfolios')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">Popular portfolios</button></li>
              <li><button type="button" onClick={() => onSelectTab('popular-portfolios')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">Ray Dalio All-Weather</button></li>
              <li><button type="button" onClick={() => onSelectTab('popular-portfolios')} className="min-h-[44px] sm:min-h-0 inline-flex items-center py-1 sm:py-0 hover:text-graphite-lightText dark:hover:text-graphite-text transition-colors">Classic 60/40</button></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="font-medium text-graphite-lightText dark:text-graphite-text mb-3">Methodology</div>
            <ul className="space-y-2">
              <li><span className="text-graphite-lightMuted dark:text-graphite-muted">Markowitz efficient frontier</span></li>
              <li><span className="text-graphite-lightMuted dark:text-graphite-muted">Geometric Brownian motion</span></li>
              <li><span className="text-graphite-lightMuted dark:text-graphite-muted">Downside Sortino deviation</span></li>
              <li><span className="text-graphite-lightMuted dark:text-graphite-muted">Risk parity contribution</span></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="pt-8 mt-8 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
          <p>
            Historical backtested returns do not guarantee future performance. Provided strictly for quantitative research and educational analysis.
          </p>
          <p>
            PORTFOLIOMETRICS STUDIO · ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </footer>
  );
};
