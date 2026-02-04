/**
 * Portfolio holdings types
 */

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
