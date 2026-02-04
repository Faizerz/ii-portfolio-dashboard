/**
 * Central type definitions for the ii-dashboard application
 *
 * This barrel file re-exports all types from organized modules.
 * Import types using: import { TypeName } from '@/types'
 */

// Common types
export type { DataQuality, FetchStatus, DateRange, PricePoint } from './common';

// Holdings types
export type { Holding, PortfolioSummary, PortfolioHistoryPoint } from './holdings';

// Fund types
export type {
  FundDetail,
  FundHolding,
  FundHoldingsData,
  FundPerformancePoint,
  FundMetadata,
} from './funds';

// API types
export type { PortfolioResponse, FundDetailResponse } from './api';

// Database types
export type {
  HoldingRow,
  TransactionRow,
  PriceRow,
  FundHoldingRow,
} from './database';

// Chart types
export type { ChartDataPoint, PieChartDataPoint, TooltipPayload } from './charts';

// Provider types
export type {
  HoldingsResult,
  ProviderInfo,
  ProgressUpdate,
  FundFetchResult,
  ProviderFetcher,
  DetectionResult,
} from './providers';
