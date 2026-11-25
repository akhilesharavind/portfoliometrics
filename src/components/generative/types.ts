export type WidgetType = 
  | 'backtest_scenario'
  | 'mpt_frontier'
  | 'monte_carlo_fan'
  | 'cagr_projection'
  | 'compound_growth'
  | 'portfolio_comparison';

export interface WidgetPayloadMap {
  backtest_scenario: {
    allocations: { symbol: string; weight: number }[];
    initialValue: number;
    startYear: number;
    endYear: number;
    benchmark?: string;
    title?: string;
  };
  mpt_frontier: {
    symbols: string[];
    riskFreeRate: number;
    title?: string;
  };
  monte_carlo_fan: {
    initialInvestment: number;
    expectedAnnualReturn: number;
    annualVolatility: number;
    annualWithdrawal: number;
    years: number;
    title?: string;
  };
  cagr_projection: {
    initialValue: number;
    finalValue: number;
    years: number;
    title?: string;
  };
  compound_growth: {
    initialInvestment: number;
    monthlyContribution: number;
    annualInterestRate: number;
    years: number;
    compoundingFrequency?: 1 | 2 | 4 | 12 | 365;
    title?: string;
  };
  portfolio_comparison: {
    portfolios: {
      id: string;
      name: string;
      allocations: { symbol: string; weight: number }[];
    }[];
    startYear: number;
    endYear: number;
    initialValue?: number;
    benchmark?: string;
    title?: string;
  };
}

export type ChatMessagePart = 
  | { type: 'text'; content: string }
  | { [K in WidgetType]: { type: 'widget'; widgetType: K; payload: WidgetPayloadMap[K] } }[WidgetType];

export interface GenerativeChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  parts: ChatMessagePart[];
  contextSnapshot?: {
    activeTab: string;
    appliedAllocations?: { symbol: string; weight: number }[];
  };
}

export interface GenerativeWidgetProps<T> {
  payload: T;
  onApplyToWorkspace?: (allocations: { symbol: string; weight: number }[]) => void;
  onNavigateTab?: (tab: string) => void;
}
