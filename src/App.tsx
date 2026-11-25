import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { BacktestingPage } from './pages/BacktestingPage';
import { OptimizationPage } from './pages/OptimizationPage';
import { MonteCarloPage } from './pages/MonteCarloPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { CagrCalculatorPage } from './pages/CagrCalculatorPage';
import { CompoundInterestPage } from './pages/CompoundInterestPage';
import { PopularPortfoliosPage } from './pages/PopularPortfoliosPage';
import { PricingPage } from './pages/PricingPage';
import { StudioProvider, useStudioContext } from './context/StudioContext';
import { StudioCopilotDrawer } from './components/copilot/StudioCopilotDrawer';

function CopilotFloatingTrigger() {
  const { toggleCopilot, copilotOpen } = useStudioContext();
  if (copilotOpen) return null;

  return (
    <button
      type="button"
      onClick={toggleCopilot}
      aria-label="Toggle Studio Copilot drawer"
      className="fixed bottom-6 right-6 z-40 px-3.5 py-2 rounded-md bg-white dark:bg-graphite-card border border-black/[0.08] dark:border-white/[0.08] text-graphite-lightText dark:text-graphite-text text-xs font-mono font-medium shadow-sm hover:border-primary transition-colors flex items-center gap-2 select-none"
    >
      <span className="w-2 h-2 rounded-full bg-primary inline-block" />
      <span>COPILOT [SYS]</span>
    </button>
  );
}

function MainApp() {
  const { activeTab, setActiveTab, applyAllocationsToWorkspace } = useStudioContext();
  const [currentTab, setCurrentTab] = useState<string>(activeTab || 'home');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [selectedAllocations, setSelectedAllocations] = useState<any[] | undefined>(undefined);
  const [initialAiPrompt, setInitialAiPrompt] = useState<string | undefined>(undefined);

  // Synchronize currentTab whenever activeTab in StudioContext changes
  useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSelectTab = (tab: string, initialPrompt?: string) => {
    if (initialPrompt) {
      setInitialAiPrompt(initialPrompt);
    }
    setCurrentTab(tab);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadAllocationsIntoBacktest = (allocations: any[]) => {
    setSelectedAllocations(allocations);
    applyAllocationsToWorkspace(allocations);
    setCurrentTab('backtesting');
    setActiveTab('backtesting');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-graphite-lightBg dark:bg-graphite-bg text-graphite-lightText dark:text-graphite-text">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage onSelectTab={handleSelectTab} />
        )}

        {currentTab === 'backtesting' && (
          <BacktestingPage initialAllocations={selectedAllocations} />
        )}

        {currentTab === 'optimization' && (
          <OptimizationPage />
        )}

        {currentTab === 'monte-carlo' && (
          <MonteCarloPage />
        )}

        {currentTab === 'ai-assistant' && (
          <AiAssistantPage
            initialPrompt={initialAiPrompt}
            onOpenBacktestWithAllocations={handleLoadAllocationsIntoBacktest}
          />
        )}

        {currentTab === 'cagr-calculator' && (
          <CagrCalculatorPage />
        )}

        {currentTab === 'compound-interest' && (
          <CompoundInterestPage />
        )}

        {currentTab === 'popular-portfolios' && (
          <PopularPortfoliosPage
            onSelectPortfolio={handleLoadAllocationsIntoBacktest}
          />
        )}

        {currentTab === 'pricing' && (
          <PricingPage />
        )}
      </main>

      <Footer onSelectTab={handleSelectTab} />
      <StudioCopilotDrawer />
      <CopilotFloatingTrigger />
    </div>
  );
}

export function App() {
  return (
    <StudioProvider>
      <MainApp />
    </StudioProvider>
  );
}

export default App;
