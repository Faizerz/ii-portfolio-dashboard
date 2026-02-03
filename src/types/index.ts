export interface Holding {
  symbol: string;
  sedol?: string;
  name: string;
  quantity: number;
  bookCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  hasYahooSymbol: boolean;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface PortfolioHistoryPoint {
  date: string;
  value: number;
  invested: number;
}

export interface FundPerformancePoint {
  date: string;
  [symbol: string]: number | string;
}

export interface FundDetail {
  symbol: string;
  sedol?: string;
  name: string;
  quantity: number;
  bookCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  hasYahooSymbol: boolean;
  priceHistory: Array<{ date: string; price: number }>;
  valueHistory: Array<{ date: string; value: number }>;
}

export interface FundHolding {
  symbol?: string;
  name: string;
  cusip?: string;
  isin?: string;
  assetType?: string;
  weightPercent: number;
  sharesHeld?: number;
  marketValue?: number;
}

export interface FundHoldingsData {
  fundSymbol: string;
  fundName: string;
  asOfDate: string;
  numberOfHoldings: number;
  holdings: FundHolding[];
  topHoldings: FundHolding[];
}
