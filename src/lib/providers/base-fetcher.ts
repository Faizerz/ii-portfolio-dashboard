/**
 * Base class for provider fetchers with common utilities
 */

import type { ProviderFetcher, FundMetadata, HoldingsResult, DataQuality } from '@/types';

export abstract class BaseFetcher implements ProviderFetcher {
  abstract name: string;
  abstract priority: number;
  abstract supportsFullHoldings: boolean;

  abstract canHandle(metadata: FundMetadata): boolean;
  abstract fetchHoldings(metadata: FundMetadata): Promise<HoldingsResult>;

  /**
   * Fetch with timeout
   */
  protected async fetchWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Determine data quality based on holdings count
   */
  protected determineDataQuality(holdingsCount: number, totalKnown?: number): DataQuality {
    if (holdingsCount === 0) return 'unavailable';
    if (holdingsCount >= 100) return 'complete';
    if (totalKnown && holdingsCount >= totalKnown * 0.9) return 'complete';
    return 'partial';
  }

  /**
   * Clean and normalize weight values
   */
  protected normalizeWeight(weight: number | string): number {
    if (typeof weight === 'string') {
      // Remove % sign and parse
      const cleaned = weight.replace('%', '').trim();
      return parseFloat(cleaned);
    }
    return weight;
  }

  /**
   * Parse date string to ISO format
   */
  protected parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 2
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...options.headers,
          },
        });

        if (response.ok) {
          return response;
        }

        // Don't retry on 4xx errors (except 429 rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await this.delay(Math.pow(2, attempt) * 500);
      }
    }

    throw lastError || new Error('Failed to fetch after retries');
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract ISIN from various formats
   */
  protected extractISIN(value: string): string | undefined {
    // Match ISIN pattern: 2 letters + 10 alphanumeric
    const match = value.match(/([A-Z]{2}[A-Z0-9]{10})/);
    return match ? match[1] : undefined;
  }

  /**
   * Clean fund name (remove common suffixes/prefixes)
   */
  protected cleanFundName(name: string): string {
    return name
      .replace(/\s+(ETF|Fund|Trust|OEIC|UCITS|Inc|Ltd|PLC)$/i, '')
      .replace(/^(The|A|An)\s+/i, '')
      .trim();
  }

  /**
   * Create empty result for failed fetches
   */
  protected createEmptyResult(provider: string): HoldingsResult {
    return {
      holdings: [],
      asOfDate: new Date().toISOString().split('T')[0],
      dataQuality: 'unavailable',
      provider,
    };
  }
}
