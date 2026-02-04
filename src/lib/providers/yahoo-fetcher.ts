/**
 * Yahoo Finance provider fetcher
 * Works for most ETFs globally - returns top 10 holdings
 */

import { BaseFetcher } from './base-fetcher';
import type { FundMetadata, HoldingsResult, FundHolding } from '@/types';
import YahooFinanceConstructor from 'yahoo-finance2';

const yahooFinance = new YahooFinanceConstructor({ suppressNotices: ['yahooSurvey'] });

export class YahooFetcher extends BaseFetcher {
  name = 'yahoo';
  priority = 60;
  supportsFullHoldings = false; // Top 10 only

  canHandle(metadata: FundMetadata): boolean {
    // Yahoo works for most stocks/ETFs with tickers
    return metadata.symbol.length > 0;
  }

  async fetchHoldings(metadata: FundMetadata): Promise<HoldingsResult> {
    try {
      // Add .L suffix for London-listed securities if not present
      const yahooSymbol = metadata.symbol.includes('.L')
        ? metadata.symbol
        : `${metadata.symbol}.L`;

      const result = await this.fetchWithTimeout(
        yahooFinance.quoteSummary(yahooSymbol, {
          modules: ['topHoldings']
        }),
        10000
      );

      if (!result.topHoldings?.holdings || result.topHoldings.holdings.length === 0) {
        console.warn(`No holdings data from Yahoo Finance for ${yahooSymbol}`);
        return this.createEmptyResult(this.name);
      }

      const holdings: FundHolding[] = result.topHoldings.holdings.map((h) => ({
        name: h.holdingName,
        symbol: h.symbol,
        ticker: h.symbol,
        weightPercent: h.holdingPercent * 100, // Convert decimal to percentage
        assetClass: 'Equity',
        assetType: 'Equity',
      }));

      // Yahoo Finance doesn't provide an as-of date, use today
      const asOfDate = new Date().toISOString().split('T')[0];

      const dataQuality = this.determineDataQuality(holdings.length);

      console.log(`Successfully fetched ${holdings.length} holdings from Yahoo Finance for ${metadata.symbol}`);

      return {
        holdings,
        asOfDate,
        dataQuality,
        provider: this.name,
        totalHoldings: holdings.length, // Yahoo only returns top 10
      };
    } catch (error) {
      console.error(`Error fetching Yahoo Finance holdings for ${metadata.symbol}:`, error);
      return this.createEmptyResult(this.name);
    }
  }
}
