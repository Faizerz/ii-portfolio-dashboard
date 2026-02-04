/**
 * Provider system types for fund holdings fetchers
 */

import { FundHolding, FundMetadata } from './funds';
import { DataQuality, FetchStatus } from './common';

export interface HoldingsResult {
  holdings: FundHolding[];
  asOfDate: string;
  dataQuality: DataQuality;
  provider: string;
  totalHoldings?: number; // Total count if different from returned
}

export interface ProviderInfo {
  provider: string;
  region: string;
  fundType: string;
  confidence: number;
}

export interface ProgressUpdate {
  status: FetchStatus;
  provider: string;
  fundSymbol: string;
  holdingsCount?: number;
  dataQuality?: DataQuality;
  error?: string;
}

export interface FundFetchResult {
  symbol: string;
  name: string;
  status: 'success' | 'failed';
  provider: string;
  holdingsCount: number;
  dataQuality: DataQuality;
  attemptedProviders: string[];
  error?: string;
}

/**
 * Base interface for all provider fetchers
 */
export interface ProviderFetcher {
  name: string;
  priority: number;
  supportsFullHoldings: boolean;

  /**
   * Check if this provider can handle the given fund
   */
  canHandle: (metadata: FundMetadata) => boolean;

  /**
   * Fetch holdings for the fund
   */
  fetchHoldings: (metadata: FundMetadata) => Promise<HoldingsResult>;
}

/**
 * Provider detection result
 */
export interface DetectionResult {
  providers: ProviderInfo[];
  signals: {
    namePattern?: string;
    isinPrefix?: string;
    symbolPattern?: string;
    fundType?: string;
  };
}
