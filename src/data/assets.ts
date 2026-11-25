export interface Asset {
  symbol: string;
  name: string;
  category: 'Stocks' | 'Bonds' | 'Commodities' | 'Real Estate' | 'Crypto';
  annualReturnMean: number;
  annualVolatility: number;
  annualReturns: Record<number, number>; // 2010 - 2025
}

export const ASSET_DATABASE: Asset[] = [
  {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    category: 'Stocks',
    annualReturnMean: 0.134,
    annualVolatility: 0.158,
    annualReturns: {
      2010: 17.2, 2011: 1.0, 2012: 16.4, 2013: 33.5, 2014: 12.5,
      2015: 0.4, 2016: 12.7, 2017: 21.2, 2018: -5.2, 2019: 30.8,
      2020: 21.0, 2021: 25.7, 2022: -19.5, 2023: 26.0, 2024: 24.2, 2025: 14.8
    }
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    category: 'Stocks',
    annualReturnMean: 0.138,
    annualVolatility: 0.152,
    annualReturns: {
      2010: 15.1, 2011: 2.1, 2012: 16.0, 2013: 32.3, 2014: 13.5,
      2015: 1.2, 2016: 12.0, 2017: 21.8, 2018: -4.5, 2019: 31.2,
      2020: 18.3, 2021: 28.7, 2022: -18.2, 2023: 26.2, 2024: 25.0, 2025: 15.2
    }
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust (Nasdaq 100)',
    category: 'Stocks',
    annualReturnMean: 0.186,
    annualVolatility: 0.198,
    annualReturns: {
      2010: 20.1, 2011: 3.5, 2012: 18.1, 2013: 36.6, 2014: 19.2,
      2015: 9.4, 2016: 7.1, 2017: 32.7, 2018: -0.1, 2019: 39.0,
      2020: 48.6, 2021: 27.4, 2022: -32.6, 2023: 54.8, 2024: 29.8, 2025: 18.5
    }
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'Stocks',
    annualReturnMean: 0.245,
    annualVolatility: 0.264,
    annualReturns: {
      2010: 53.1, 2011: 25.6, 2012: 32.6, 2013: 8.1, 2014: 40.6,
      2015: -3.0, 2016: 12.5, 2017: 48.5, 2018: -5.4, 2019: 89.0,
      2020: 82.3, 2021: 34.6, 2022: -26.4, 2023: 49.0, 2024: 28.5, 2025: 19.2
    }
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    category: 'Stocks',
    annualReturnMean: 0.228,
    annualVolatility: 0.231,
    annualReturns: {
      2010: -6.5, 2011: -4.5, 2012: 5.8, 2013: 44.3, 2014: 27.5,
      2015: 22.7, 2016: 15.1, 2017: 40.7, 2018: 20.8, 2019: 57.6,
      2020: 42.5, 2021: 52.5, 2022: -28.0, 2023: 58.2, 2024: 21.0, 2025: 16.4
    }
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'Stocks',
    annualReturnMean: 0.442,
    annualVolatility: 0.465,
    annualReturns: {
      2010: -17.4, 2011: -9.8, 2012: -10.9, 2013: 34.7, 2014: 29.5,
      2015: 69.1, 2016: 227.0, 2017: 81.3, 2018: -31.0, 2019: 76.9,
      2020: 122.3, 2021: 125.5, 2022: -50.3, 2023: 239.0, 2024: 178.5, 2025: 35.0
    }
  },
  {
    symbol: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    category: 'Bonds',
    annualReturnMean: 0.026,
    annualVolatility: 0.061,
    annualReturns: {
      2010: 6.5, 2011: 7.8, 2012: 4.2, 2013: -2.1, 2014: 5.9,
      2015: 0.5, 2016: 2.6, 2017: 3.6, 2018: 0.0, 2019: 8.7,
      2020: 7.5, 2021: -1.7, 2022: -13.1, 2023: 5.7, 2024: 4.1, 2025: 5.2
    }
  },
  {
    symbol: 'TLT',
    name: 'iShares 20+ Year Treasury Bond ETF',
    category: 'Bonds',
    annualReturnMean: 0.038,
    annualVolatility: 0.142,
    annualReturns: {
      2010: 9.0, 2011: 33.7, 2012: 2.6, 2013: -13.9, 2014: 27.3,
      2015: -1.8, 2016: 1.1, 2017: 9.1, 2018: -1.6, 2019: 14.1,
      2020: 18.1, 2021: -4.6, 2022: -31.2, 2023: 2.8, 2024: -1.5, 2025: 6.8
    }
  },
  {
    symbol: 'GLD',
    name: 'SPDR Gold Shares',
    category: 'Commodities',
    annualReturnMean: 0.076,
    annualVolatility: 0.155,
    annualReturns: {
      2010: 29.3, 2011: 9.6, 2012: 6.6, 2013: -28.3, 2014: -2.2,
      2015: -10.7, 2016: 8.0, 2017: 12.8, 2018: -1.9, 2019: 17.9,
      2020: 24.8, 2021: -3.5, 2022: -0.8, 2023: 13.1, 2024: 31.5, 2025: 18.2
    }
  },
  {
    symbol: 'VXUS',
    name: 'Vanguard Total International Stock ETF',
    category: 'Stocks',
    annualReturnMean: 0.058,
    annualVolatility: 0.165,
    annualReturns: {
      2010: 11.2, 2011: -14.2, 2012: 18.2, 2013: 15.3, 2014: -4.2,
      2015: -4.3, 2016: 4.7, 2017: 27.4, 2018: -14.4, 2019: 21.6,
      2020: 11.1, 2021: 8.6, 2022: -16.0, 2023: 15.8, 2024: 8.5, 2025: 10.2
    }
  },
  {
    symbol: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    category: 'Stocks',
    annualReturnMean: 0.128,
    annualVolatility: 0.145,
    annualReturns: {
      2010: 14.5, 2011: 1.2, 2012: 16.5, 2013: 32.9, 2014: 15.9,
      2015: -0.3, 2016: 17.1, 2017: 20.9, 2018: -5.6, 2019: 31.5,
      2020: 15.2, 2021: 29.9, 2022: -3.2, 2023: 4.6, 2024: 16.8, 2025: 11.4
    }
  },
  {
    symbol: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    category: 'Real Estate',
    annualReturnMean: 0.082,
    annualVolatility: 0.185,
    annualReturns: {
      2010: 28.5, 2011: 8.7, 2012: 17.4, 2013: 2.5, 2014: 30.4,
      2015: 2.5, 2016: 8.5, 2017: 4.9, 2018: -6.0, 2019: 28.9,
      2020: -4.7, 2021: 40.4, 2022: -26.2, 2023: 12.1, 2024: 14.2, 2025: 9.8
    }
  },
  {
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    category: 'Crypto',
    annualReturnMean: 0.650,
    annualVolatility: 0.720,
    annualReturns: {
      2015: 35.0, 2016: 125.0, 2017: 1375.0, 2018: -72.6, 2019: 92.2,
      2020: 305.0, 2021: 59.8, 2022: -64.2, 2023: 155.8, 2024: 119.5, 2025: 42.0
    }
  }
];

export function getAsset(symbol: string): Asset | undefined {
  return ASSET_DATABASE.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
}
