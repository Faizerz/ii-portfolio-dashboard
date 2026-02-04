# Type System

This directory contains the centralized type definitions for the ii-dashboard application.

## Structure

```
src/types/
├── index.ts          # Barrel export - import types from here
├── common.ts         # Shared utility types
├── holdings.ts       # Portfolio holdings types
├── funds.ts          # Fund-related types
├── api.ts            # API request/response types
├── database.ts       # Database row types
├── charts.ts         # Chart component types
└── providers.ts      # Provider system types
```

## Usage

**Always import types from the barrel export:**

```typescript
import type { Holding, FundHolding, PortfolioResponse } from '@/types';
```

## Type Modules

### common.ts
Shared types used across the application:
- `DataQuality` - Data quality indicator ('complete' | 'partial' | 'unavailable')
- `FetchStatus` - Fetch operation status
- `DateRange` - Date range filter
- `PricePoint` - Price time series point

### holdings.ts
Portfolio holdings types:
- `Holding` - Individual portfolio holding (fund/stock)
- `PortfolioSummary` - Aggregated portfolio metrics
- `PortfolioHistoryPoint` - Portfolio value over time

### funds.ts
Fund-related types:
- `FundDetail` - Complete fund information with history
- `FundHolding` - **Canonical type** for fund holdings (uses `weightPercent`)
- `FundMetadata` - Basic fund metadata for lookups
- `FundPerformancePoint` - Performance time series

**Important**: `FundHolding` uses `weightPercent` as the primary field (matches database schema `weight_percent`).

### api.ts
API request and response types:
- `PortfolioResponse` - Main portfolio API response
- `FundDetailResponse` - Fund detail API response

### database.ts
Database row types (matching SQLite schema):
- `HoldingRow` - holdings table
- `TransactionRow` - transactions table
- `PriceRow` - prices table
- `FundHoldingRow` - fund_holdings table

### charts.ts
Chart component types:
- `ChartDataPoint` - Generic chart data point
- `PieChartDataPoint` - Pie chart specific data
- `TooltipPayload` - Recharts tooltip payload

### providers.ts
Provider system types for the fund holdings fetcher:
- `HoldingsResult` - Provider fetch result
- `ProviderFetcher` - Base provider interface
- `ProviderInfo` - Provider metadata
- `FundFetchResult` - Fetch operation result
- `ProgressUpdate` - Fetch progress callback
- `DetectionResult` - Provider detection result

## Design Principles

1. **Single Source of Truth**: Each type is defined once in the appropriate module
2. **Clear Separation**: Types are organized by domain (holdings, funds, api, etc.)
3. **Convenient Import**: Barrel export (`index.ts`) allows simple imports
4. **Type Safety**: All types use TypeScript's type keyword for clarity
5. **Documentation**: Each type module includes JSDoc comments

## Migration Notes

If you're migrating from old type definitions:

- ❌ `import { FundHolding } from '@/lib/providers/types'`
- ✅ `import { FundHolding } from '@/types'`

- ❌ Local interface definitions in components
- ✅ Import from centralized types

- ❌ `FundHolding.weight`
- ✅ `FundHolding.weightPercent`
