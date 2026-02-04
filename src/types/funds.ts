/**
 * Fund-related types
 */

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

/**
 * Canonical FundHolding interface - uses weightPercent as primary field
 * This matches the database schema column name (weight_percent)
 */
export interface FundHolding {
  symbol?: string;
  name: string;
  cusip?: string;
  isin?: string;
  sedol?: string;
  ticker?: string;
  assetType?: string;
  assetClass?: string;
  weightPercent: number;
  sharesHeld?: number;
  shares?: number;
  marketValue?: number;
  value?: number;
  sector?: string;
  country?: string;
}

export interface FundHoldingsData {
  fundSymbol: string;
  fundName: string;
  asOfDate: string;
  numberOfHoldings: number;
  holdings: FundHolding[];
  topHoldings: FundHolding[];
}

export interface FundPerformancePoint {
  date: string;
  [symbol: string]: number | string;
}

export interface FundMetadata {
  symbol: string;
  name: string;
  isin?: string;
  sedol?: string;
  value?: number;
  quantity?: number;
}
