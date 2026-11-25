import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Calculator, 
  PiggyBank, 
  FolderKanban, 
  ChevronDown, 
  Sun, 
  Moon, 
  Menu, 
  X,
  MessageSquare
} from 'lucide-react';
import { useStudioContext } from '../context/StudioContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  darkMode,
  onToggleDarkMode
}) => {
  const [productsOpen, setProductsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { copilotOpen, toggleCopilot } = useStudioContext();

  const handleNav = (tab: string) => {
    onSelectTab(tab);
    setProductsOpen(false);
    setToolsOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-graphite-lightBg/95 dark:bg-graphite-bg/95 border-b border-black/[0.08] dark:border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        
        {/* Brand */}
        <button 
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 select-none text-left bg-transparent border-0 p-0 focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <div className="w-5 h-5 rounded-[3px] bg-primary flex items-center justify-center text-white font-mono text-[11px] font-bold" aria-hidden="true">
            P
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-graphite-lightText dark:text-graphite-text">
              PORTFOLIOMETRICS
            </span>
            <span className="hidden lg:inline text-[9px] font-mono tracking-widest text-graphite-lightMuted dark:text-graphite-muted uppercase">
              [LAB]
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              currentTab === 'home'
                ? 'text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            Home
          </button>

          {/* Products Dropdown */}
          <div className="relative">
            <button
              type="button"
              aria-expanded={productsOpen}
              aria-haspopup="true"
              onClick={() => { setProductsOpen(!productsOpen); setToolsOpen(false); }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                ['backtesting', 'optimization', 'monte-carlo', 'ai-assistant'].includes(currentTab)
                  ? 'text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[10px] font-mono opacity-50 mr-0.5">01</span>
              <span>Products</span>
              <ChevronDown aria-hidden="true" className={`w-3.5 h-3.5 opacity-60 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
            </button>

            {productsOpen && (
              <div 
                role="menu"
                className="absolute left-0 mt-1.5 w-60 rounded-lg shadow-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] p-1.5 z-50"
                onMouseLeave={() => setProductsOpen(false)}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNav('backtesting')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <BarChart3 aria-hidden="true" className="w-4 h-4 text-graphite-lightMuted dark:text-graphite-muted mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Backtesting</div>
                    <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Historical returns and risk metrics</div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNav('optimization')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <TrendingUp aria-hidden="true" className="w-4 h-4 text-graphite-lightMuted dark:text-graphite-muted mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Optimization</div>
                    <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Markowitz efficient frontier</div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNav('monte-carlo')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Activity aria-hidden="true" className="w-4 h-4 text-graphite-lightMuted dark:text-graphite-muted mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Monte Carlo</div>
                    <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Retirement wealth simulations</div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNav('ai-assistant')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <MessageSquare aria-hidden="true" className="w-4 h-4 text-graphite-lightMuted dark:text-graphite-muted mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">AI Assistant</div>
                    <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Natural language portfolio queries</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Tools Dropdown */}
          <div className="relative">
            <button
              type="button"
              aria-expanded={toolsOpen}
              aria-haspopup="true"
              onClick={() => { setToolsOpen(!toolsOpen); setProductsOpen(false); }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                ['cagr-calculator', 'compound-interest', 'popular-portfolios'].includes(currentTab)
                  ? 'text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-[10px] font-mono opacity-50 mr-0.5">02</span>
              <span>Tools</span>
              <ChevronDown aria-hidden="true" className={`w-3.5 h-3.5 opacity-60 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {toolsOpen && (
              <div 
                role="menu"
                className="absolute left-0 mt-1.5 w-60 rounded-lg shadow-lg bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] p-1.5 z-50"
                onMouseLeave={() => setToolsOpen(false)}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNav('cagr-calculator')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Calculator aria-hidden="true" className="w-4 h-4 text-graphite-lightMuted dark:text-graphite-muted mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">CAGR Calculator</div>
                    <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Compound annual growth rate</div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNav('compound-interest')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <PiggyBank aria-hidden="true" className="w-4 h-4 text-graphite-lightMuted dark:text-graphite-muted mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Compound Interest</div>
                    <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">Long-term accumulation schedules</div>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNav('popular-portfolios')}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <FolderKanban aria-hidden="true" className="w-4 h-4 text-graphite-lightMuted dark:text-graphite-muted mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-graphite-lightText dark:text-graphite-text">Popular Portfolios</div>
                    <div className="text-[11px] text-graphite-lightMuted dark:text-graphite-muted">All-Weather, 60/40, Three-Fund</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Pricing */}
          <button
            type="button"
            onClick={() => handleNav('pricing')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
              currentTab === 'pricing'
                ? 'text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            <span className="text-[10px] font-mono opacity-50">03</span>
            <span>Pricing</span>
          </button>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-[10px] font-mono text-graphite-lightMuted dark:text-graphite-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
            <span>SYSTEM: ONLINE</span>
          </div>

          {/* Studio Copilot toggle */}
          <button
            type="button"
            onClick={toggleCopilot}
            aria-pressed={copilotOpen}
            aria-label="Toggle Studio Copilot"
            className={`hidden sm:inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-md text-xs font-mono border transition-colors ${
              copilotOpen
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-black/[0.08] dark:border-white/[0.08] text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" aria-hidden="true" />
            <span>Copilot</span>
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-graphite-lightMuted dark:text-graphite-muted hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
          >
            {darkMode ? <Sun aria-hidden="true" className="w-4 h-4 text-graphite-secondary" /> : <Moon aria-hidden="true" className="w-4 h-4 text-graphite-lightSecondary" />}
          </button>

          {/* Action */}
          <div className="hidden sm:flex items-center gap-2">
            <button 
              type="button"
              onClick={() => handleNav('backtesting')}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-[5px] transition-colors flex items-center shadow-sm"
            >
              <span>Launch Engine</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-graphite-lightSecondary dark:text-graphite-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.05] rounded-md"
          >
            {mobileMenuOpen ? <X aria-hidden="true" className="w-5 h-5" /> : <Menu aria-hidden="true" className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-graphite-card border-b border-black/[0.08] dark:border-white/[0.08] p-4 space-y-3">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3 min-h-[44px] flex items-center rounded-md text-xs font-medium transition-colors ${
              currentTab === 'home'
                ? 'text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            Home
          </button>
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-medium text-graphite-lightMuted dark:text-graphite-muted">Products</div>
            <button
              type="button"
              onClick={() => handleNav('backtesting')}
              className={`w-full text-left px-3 min-h-[44px] flex items-center rounded-md text-xs transition-colors ${
                currentTab === 'backtesting'
                  ? 'font-medium text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              Portfolio Backtesting
            </button>
            <button
              type="button"
              onClick={() => handleNav('optimization')}
              className={`w-full text-left px-3 min-h-[44px] flex items-center rounded-md text-xs transition-colors ${
                currentTab === 'optimization'
                  ? 'font-medium text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              Portfolio Optimization
            </button>
            <button
              type="button"
              onClick={() => handleNav('monte-carlo')}
              className={`w-full text-left px-3 min-h-[44px] flex items-center rounded-md text-xs transition-colors ${
                currentTab === 'monte-carlo'
                  ? 'font-medium text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              Monte Carlo Simulation
            </button>
            <button
              type="button"
              onClick={() => handleNav('ai-assistant')}
              className={`w-full text-left px-3 min-h-[44px] flex items-center rounded-md text-xs transition-colors ${
                currentTab === 'ai-assistant'
                  ? 'font-medium text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              AI Assistant
            </button>
          </div>
          <div className="space-y-1 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="px-3 text-[11px] font-medium text-graphite-lightMuted dark:text-graphite-muted">Tools</div>
            <button
              type="button"
              onClick={() => handleNav('cagr-calculator')}
              className={`w-full text-left px-3 min-h-[44px] flex items-center rounded-md text-xs transition-colors ${
                currentTab === 'cagr-calculator'
                  ? 'font-medium text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              CAGR Calculator
            </button>
            <button
              type="button"
              onClick={() => handleNav('compound-interest')}
              className={`w-full text-left px-3 min-h-[44px] flex items-center rounded-md text-xs transition-colors ${
                currentTab === 'compound-interest'
                  ? 'font-medium text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              Compound Interest
            </button>
            <button
              type="button"
              onClick={() => handleNav('popular-portfolios')}
              className={`w-full text-left px-3 min-h-[44px] flex items-center rounded-md text-xs transition-colors ${
                currentTab === 'popular-portfolios'
                  ? 'font-medium text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              Popular Portfolios
            </button>
            <button
              type="button"
              onClick={() => handleNav('pricing')}
              className={`w-full text-left px-3 min-h-[44px] flex items-center rounded-md text-xs transition-colors ${
                currentTab === 'pricing'
                  ? 'font-medium text-graphite-lightText dark:text-graphite-text bg-black/[0.05] dark:bg-white/[0.07]'
                  : 'text-graphite-lightSecondary dark:text-graphite-secondary hover:text-graphite-lightText dark:hover:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              Pricing
            </button>
          </div>
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                toggleCopilot();
                setMobileMenuOpen(false);
              }}
              aria-pressed={copilotOpen}
              className={`w-full text-left px-3 min-h-[44px] flex items-center justify-between rounded-md text-xs font-mono border transition-colors ${
                copilotOpen
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" aria-hidden="true" />
                <span>Studio Copilot</span>
              </span>
              <span className="text-[10px] text-graphite-lightMuted dark:text-graphite-muted">
                {copilotOpen ? 'ACTIVE' : 'OPEN'}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
