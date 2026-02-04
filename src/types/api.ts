/**
 * API request and response types
 */

import { Holding, PortfolioSummary, PortfolioHistoryPoint } from './holdings';
import { FundDetail, FundPerformancePoint } from './funds';

export interface PortfolioResponse {
  holdings: Holding[];
  portfolioHistory: PortfolioHistoryPoint[];
  fundPerformance: FundPerformancePoint[];
  fundNames: string[];
  fundLabels: Record<string, string>;
  summary: PortfolioSummary | null;
}

export interface FundDetailResponse extends FundDetail {}
