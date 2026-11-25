import { runBacktest } from '../services/backtestingEngine';

export interface PopularPortfolio {
  id: string;
  name: string;
  tagline: string;
  category: 'Classic' | 'All-Weather' | 'Growth' | 'Income' | 'Tactical';
  description: string;
  allocations: { symbol: string; name: string; weight: number }[];
  cagr10Y: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
}

const RAW_POPULAR_PORTFOLIOS: Omit<PopularPortfolio, 'cagr10Y' | 'sharpeRatio' | 'maxDrawdown' | 'volatility'>[] = [
  {
    id: 'all-weather',
    name: 'Ray Dalio All Weather Portfolio',
    tagline: 'Engineered by Bridgewater to thrive across all economic seasons',
    category: 'All-Weather',
    description: 'A risk-parity portfolio designed to weather inflation, deflation, rising growth, and falling growth with low volatility.',
    allocations: [
      { symbol: 'VTI', name: 'Total US Stock Market', weight: 30 },
      { symbol: 'TLT', name: 'Long-Term Treasury Bonds', weight: 40 },
      { symbol: 'BND', name: 'Intermediate Treasury / Bond', weight: 15 },
      { symbol: 'GLD', name: 'Gold', weight: 7.5 },
      { symbol: 'VNQ', name: 'Commodities & Real Estate', weight: 7.5 }
    ]
  },
  {
    id: 'classic-60-40',
    name: 'Classic 60/40 Portfolio',
    tagline: 'The time-tested institutional balanced benchmark',
    category: 'Classic',
    description: '60% equities for capital appreciation and 40% fixed income for steady income and downside buffer.',
    allocations: [
      { symbol: 'VTI', name: 'Total US Stock Market', weight: 60 },
      { symbol: 'BND', name: 'Total Bond Market', weight: 40 }
    ]
  },
  {
    id: 'three-fund',
    name: 'Bogleheads Three-Fund Portfolio',
    tagline: 'The simple, low-cost gold standard for passive index investors',
    category: 'Classic',
    description: 'Total US stock market, total international market, and total bond market for ultra-broad global diversification.',
    allocations: [
      { symbol: 'VTI', name: 'Total US Stock Market', weight: 48 },
      { symbol: 'VXUS', name: 'Total International Stock', weight: 32 },
      { symbol: 'BND', name: 'Total Bond Market', weight: 20 }
    ]
  },
  {
    id: 'buffett-90-10',
    name: 'Warren Buffett 90/10 Portfolio',
    tagline: 'Buffett estate recommendation: aggressive low-cost compounding',
    category: 'Growth',
    description: '90% low-cost S&P 500 index fund (SPY) and 10% total bond market (BND) for long-term equity compounding.',
    allocations: [
      { symbol: 'SPY', name: 'S&P 500 ETF', weight: 90 },
      { symbol: 'BND', name: 'Total Bond Market', weight: 10 }
    ]
  },
  {
    id: 'tech-titans',
    name: 'Tech & AI Growth Portfolio',
    tagline: 'High-conviction exposure to the secular technology expansion',
    category: 'Growth',
    description: 'Combines the Nasdaq 100 with market leaders in AI, enterprise cloud, and consumer software for maximum growth.',
    allocations: [
      { symbol: 'QQQ', name: 'Invesco Nasdaq 100', weight: 40 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 20 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 20 },
      { symbol: 'AAPL', name: 'Apple Inc.', weight: 20 }
    ]
  },
  {
    id: 'dividend-aristocrats',
    name: 'Dividend Aristocrat Income',
    tagline: 'Consistent cash flow, high dividend reinvestment, and defensive stability',
    category: 'Income',
    description: 'Focuses on financially robust companies with high dividend yields and persistent dividend growth track records.',
    allocations: [
      { symbol: 'SCHD', name: 'Schwab US Dividend Equity', weight: 50 },
      { symbol: 'SPY', name: 'S&P 500', weight: 30 },
      { symbol: 'VNQ', name: 'Vanguard Real Estate REITs', weight: 20 }
    ]
  }
];

export const POPULAR_PORTFOLIOS: PopularPortfolio[] = RAW_POPULAR_PORTFOLIOS.map((p) => {
  const res = runBacktest({
    allocations: p.allocations.map(a => ({ symbol: a.symbol, weight: a.weight })),
    initialValue: 10000,
    cashFlowType: 'none',
    cashFlowAmount: 0,
    startYear: 2016,
    endYear: 2025,
    rebalancing: 'annually',
    benchmark: 'SPY',
    riskFreeRate: 0.04
  });
  return {
    ...p,
    cagr10Y: Number(res.cagr.toFixed(1)),
    sharpeRatio: res.sharpeRatio,
    maxDrawdown: Number(res.maxDrawdown.toFixed(1)),
    volatility: Number(res.volatility.toFixed(1))
  };
});
