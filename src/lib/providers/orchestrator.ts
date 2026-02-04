/**
 * Fetch orchestrator
 * Coordinates waterfall fetching across multiple providers with progress callbacks
 */

import type {
  FundMetadata,
  HoldingsResult,
  ProgressUpdate,
  FundFetchResult,
} from '@/types';
import { detectProviders } from './detector';
import { getProviderFetcher } from './registry';
import { cacheFundHoldingsWithProvider } from '../db';

/**
 * Fetch holdings for a single fund using waterfall strategy
 */
export async function fetchHoldingsWithProviders(
  fund: FundMetadata,
  onProgress?: (status: ProgressUpdate) => void
): Promise<HoldingsResult> {
  // Detect providers to try
  const detection = detectProviders(fund);
  const attemptedProviders: string[] = [];

  console.log(`\n=== Fetching holdings for ${fund.symbol} (${fund.name}) ===`);
  console.log(`Detected providers (by confidence):`, detection.providers.map(p => `${p.provider}:${p.confidence}`));

  // Try each provider in order until success
  for (const providerInfo of detection.providers) {
    const fetcher = getProviderFetcher(providerInfo.provider);

    if (!fetcher) {
      console.warn(`Provider ${providerInfo.provider} not found in registry`);
      continue;
    }

    attemptedProviders.push(providerInfo.provider);

    // Notify progress
    onProgress?.({
      status: 'trying',
      provider: providerInfo.provider,
      fundSymbol: fund.symbol,
    });

    console.log(`[${providerInfo.provider}] Attempting fetch (confidence: ${providerInfo.confidence})...`);

    try {
      // Try to fetch with timeout
      const result = await Promise.race([
        fetcher.fetchHoldings(fund),
        timeoutPromise(10000), // 10s timeout per provider
      ]);

      // Check if successful
      if (result.holdings.length > 0) {
        console.log(`[${providerInfo.provider}] ✓ Success: ${result.holdings.length} holdings (${result.dataQuality})`);

        onProgress?.({
          status: 'success',
          provider: providerInfo.provider,
          fundSymbol: fund.symbol,
          holdingsCount: result.holdings.length,
          dataQuality: result.dataQuality,
        });

        return result;
      } else {
        console.log(`[${providerInfo.provider}] × No holdings returned`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[${providerInfo.provider}] × Failed: ${errorMessage}`);

      onProgress?.({
        status: 'failed',
        provider: providerInfo.provider,
        fundSymbol: fund.symbol,
        error: errorMessage,
      });
    }

    // Delay between provider attempts to avoid rate limiting
    await delay(500);
  }

  console.log(`✗ All providers exhausted for ${fund.symbol}`);

  // All providers failed
  return {
    holdings: [],
    asOfDate: new Date().toISOString().split('T')[0],
    dataQuality: 'unavailable',
    provider: 'none',
  };
}

/**
 * Batch fetch holdings for multiple funds with rate limiting
 */
export async function fetchAllHoldingsWithProgress(
  funds: FundMetadata[],
  onProgress?: (update: ProgressUpdate) => void
): Promise<FundFetchResult[]> {
  const results: FundFetchResult[] = [];

  console.log(`\n=== Starting batch fetch for ${funds.length} funds ===\n`);

  // Process funds sequentially to respect rate limits
  // TODO: Implement p-queue for concurrent fetching with configurable concurrency
  for (let i = 0; i < funds.length; i++) {
    const fund = funds[i];

    console.log(`\n[${i + 1}/${funds.length}] Processing ${fund.symbol}...`);

    const attemptedProviders: string[] = [];

    // Track attempted providers via progress callback
    const trackingCallback = (update: ProgressUpdate) => {
      if (update.status === 'trying') {
        attemptedProviders.push(update.provider);
      }
      onProgress?.(update);
    };

    const result = await fetchHoldingsWithProviders(fund, trackingCallback);

    const fetchResult: FundFetchResult = {
      symbol: fund.symbol,
      name: fund.name,
      status: result.holdings.length > 0 ? 'success' : 'failed',
      provider: result.provider,
      holdingsCount: result.holdings.length,
      dataQuality: result.dataQuality,
      attemptedProviders,
      error: result.holdings.length === 0 ? 'No data available from any provider' : undefined,
    };

    results.push(fetchResult);

    // Cache holdings in database if successful
    if (result.holdings.length > 0) {
      try {
        const holdingsForDb = result.holdings.map((h) => ({
          holding_symbol: h.symbol || h.ticker || null,
          holding_name: h.name,
          cusip: h.cusip || null,
          isin: h.isin || null,
          asset_type: h.assetType || h.assetClass || null,
          weight_percent: h.weightPercent,
          shares_held: h.sharesHeld || h.shares || null,
          market_value: h.marketValue || h.value || null,
        }));

        cacheFundHoldingsWithProvider(
          fund.symbol,
          holdingsForDb,
          result.asOfDate,
          result.provider,
          result.dataQuality
        );

        console.log(`[${i + 1}/${funds.length}] Cached ${result.holdings.length} holdings to database`);
      } catch (error) {
        console.error(`[${i + 1}/${funds.length}] Failed to cache holdings:`, error);
      }
    }

    console.log(`[${i + 1}/${funds.length}] Completed: ${fetchResult.status} (${fetchResult.holdingsCount} holdings from ${fetchResult.provider})`);

    // Return the result for immediate processing
    // Yield control back to allow caller to process result
    await delay(100);
  }

  console.log(`\n=== Batch fetch complete: ${results.filter(r => r.status === 'success').length}/${results.length} successful ===\n`);

  return results;
}

/**
 * Helper: Create a timeout promise
 */
function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
}

/**
 * Helper: Delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get summary statistics from fetch results
 */
export function getFetchSummary(results: FundFetchResult[]) {
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const complete = results.filter(r => r.dataQuality === 'complete').length;
  const partial = results.filter(r => r.dataQuality === 'partial').length;

  const providerCounts = results.reduce((acc, r) => {
    if (r.status === 'success') {
      acc[r.provider] = (acc[r.provider] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    total: results.length,
    successful,
    failed,
    successRate: (successful / results.length) * 100,
    complete,
    partial,
    providerCounts,
  };
}
