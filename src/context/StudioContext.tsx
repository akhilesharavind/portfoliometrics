import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export interface AllocationItem {
  symbol: string;
  weight: number;
}

export interface BacktestHandoffParams {
  initialValue?: number;
  startYear?: number;
  endYear?: number;
  cashFlowType?: 'none' | 'monthly_contribution' | 'annual_contribution' | 'monthly_withdrawal';
  cashFlowAmount?: number;
  benchmark?: string;
}

export interface CompoundHandoffParams {
  initialInvestment?: number;
  monthlyContribution?: number;
  annualInterestRate?: number;
  years?: number;
  compoundingFrequency?: 1 | 2 | 4 | 12 | 365;
}

export interface CagrHandoffParams {
  initialValue?: number;
  finalValue?: number;
  years?: number;
}

export interface MonteCarloHandoffParams {
  initialInvestment?: number;
  expectedAnnualReturn?: number;
  annualVolatility?: number;
  annualWithdrawal?: number;
  inflationRate?: number;
  years?: number;
}

export type PlanTier = 'Free' | 'Pro' | 'Institutional';

export interface StudioContextType {
  activeAllocations: AllocationItem[];
  setActiveAllocations: (allocations: AllocationItem[]) => void;
  applyAllocationsToWorkspace: (allocations: AllocationItem[]) => void;
  backtestParams: BacktestHandoffParams | null;
  setBacktestParams: (params: BacktestHandoffParams | null) => void;
  compoundParams: CompoundHandoffParams | null;
  setCompoundParams: (params: CompoundHandoffParams | null) => void;
  cagrParams: CagrHandoffParams | null;
  setCagrParams: (params: CagrHandoffParams | null) => void;
  monteCarloParams: MonteCarloHandoffParams | null;
  setMonteCarloParams: (params: MonteCarloHandoffParams | null) => void;
  activePlan: PlanTier;
  setActivePlan: (plan: PlanTier) => void;
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

interface StudioProviderProps {
  children: ReactNode;
  initialTab?: string;
  onNavigateTab?: (tab: string) => void;
  onApplyAllocations?: (allocations: AllocationItem[]) => void;
}

const readStoredPlan = (): PlanTier => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('pm_active_plan');
      if (saved === 'Free' || saved === 'Pro' || saved === 'Institutional') {
        return saved;
      }
    }
  } catch {
    // ignore storage errors
  }
  return 'Free';
};

export const StudioProvider: React.FC<StudioProviderProps> = ({
  children,
  initialTab = 'home',
  onNavigateTab,
  onApplyAllocations
}) => {
  const [activeAllocations, setActiveAllocationsState] = useState<AllocationItem[]>([
    { symbol: 'VTI', weight: 60 },
    { symbol: 'BND', weight: 40 }
  ]);
  const [backtestParams, setBacktestParams] = useState<BacktestHandoffParams | null>(null);
  const [compoundParams, setCompoundParams] = useState<CompoundHandoffParams | null>(null);
  const [cagrParams, setCagrParams] = useState<CagrHandoffParams | null>(null);
  const [monteCarloParams, setMonteCarloParams] = useState<MonteCarloHandoffParams | null>(null);
  const [activePlan, setActivePlanState] = useState<PlanTier>(readStoredPlan);
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false);
  const [activeTab, setActiveTabState] = useState<string>(initialTab);

  const setActivePlan = useCallback((plan: PlanTier) => {
    setActivePlanState(plan);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('pm_active_plan', plan);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleCopilot = useCallback(() => {
    setCopilotOpen(prev => !prev);
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  }, [onNavigateTab]);

  const setActiveAllocations = useCallback((allocations: AllocationItem[]) => {
    setActiveAllocationsState(allocations.map(a => ({ ...a })));
  }, []);

  const applyAllocationsToWorkspace = useCallback((allocations: AllocationItem[]) => {
    const cloned = allocations.map(a => ({ ...a }));
    setActiveAllocationsState(cloned);
    if (onApplyAllocations) {
      onApplyAllocations(cloned);
    }
  }, [onApplyAllocations]);

  const value = useMemo<StudioContextType>(() => ({
    activeAllocations,
    setActiveAllocations,
    applyAllocationsToWorkspace,
    backtestParams,
    setBacktestParams,
    compoundParams,
    setCompoundParams,
    cagrParams,
    setCagrParams,
    monteCarloParams,
    setMonteCarloParams,
    activePlan,
    setActivePlan,
    copilotOpen,
    setCopilotOpen,
    toggleCopilot,
    activeTab,
    setActiveTab
  }), [
    activeAllocations,
    setActiveAllocations,
    applyAllocationsToWorkspace,
    backtestParams,
    compoundParams,
    cagrParams,
    monteCarloParams,
    activePlan,
    setActivePlan,
    copilotOpen,
    toggleCopilot,
    activeTab,
    setActiveTab
  ]);

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
};

export const useStudioContext = (): StudioContextType => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudioContext must be used within a StudioProvider');
  }
  return context;
};

export const useOptionalStudioContext = (): StudioContextType | null => {
  return useContext(StudioContext) ?? null;
};
