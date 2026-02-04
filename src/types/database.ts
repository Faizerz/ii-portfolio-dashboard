/**
 * Database row types
 */

export interface HoldingRow {
  symbol: string;
  sedol: string | null;
  name: string;
  quantity: number;
  book_cost: number;
  has_yahoo_symbol: number;
}

export interface TransactionRow {
  id: number;
  date: string;
  type: string;
  symbol: string;
  sedol: string | null;
  name: string;
  quantity: number;
  price: number;
  total_cost: number;
  created_at: string;
}

export interface PriceRow {
  symbol: string;
  date: string;
  price: number;
  created_at: string;
}

export interface FundHoldingRow {
  id: number;
  fund_symbol: string;
  fund_name: string;
  holding_name: string;
  holding_symbol: string | null;
  holding_isin: string | null;
  holding_cusip: string | null;
  weight_percent: number;
  shares_held: number | null;
  market_value: number | null;
  asset_type: string | null;
  as_of_date: string;
  provider: string;
  data_quality: string;
  created_at: string;
}
