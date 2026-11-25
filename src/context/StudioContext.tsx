import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export interface AllocationItem {
  symbol: string;
  weight: number;
}

export interface StudioContextType {
  activeAllocations: AllocationItem[];
  setActiveAllocations: (allocations: AllocationItem[]) => void;
  applyAllocationsToWorkspace: (allocations: AllocationItem[]) => void;
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
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false);
  const [activeTab, setActiveTabState] = useState<string>(initialTab);

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
    copilotOpen,
    setCopilotOpen,
    toggleCopilot,
    activeTab,
    setActiveTab
  }), [
    activeAllocations,
    setActiveAllocations,
    applyAllocationsToWorkspace,
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
