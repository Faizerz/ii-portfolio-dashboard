/**
 * Morningstar provider fetcher
 * Fallback provider with variable quality
 */

import { BaseFetcher } from './base-fetcher';
import type { FundMetadata, HoldingsResult, FundHolding } from '@/types';
import { searchFundByISIN, searchFundByName } from '../morningstar-fetcher';

interface MorningstarPortfolioResponse {
  Name?: string;
  Date?: string;
  EquityHolding?: Array<{
    SecurityName?: string;
    Ticker?: string;
    ISIN?: string;
    CUSIP?: string;
    WeightingPercent?: number;
    NumberOfShare?: number;
    MarketValue?: number;
  }>;
}

export class MorningstarFetcher extends BaseFetcher {
  name = 'morningstar';
  priority = 40;
  supportsFullHoldings = true; // Variable - depends on fund

  canHandle(metadata: FundMetadata): boolean {
    // Morningstar is a universal fallback - always returns true
    return true;
  }

  async fetchHoldings(metadata: FundMetadata): Promise<HoldingsResult> {
    try {
      // Step 1: Find Morningstar ID
      let secId: string | null = null;

      // Try ISIN first
      if (metadata.isin) {
        const fund = await searchFundByISIN(metadata.isin);
        if (fund) {
          secId = fund.secId;
          console.log(`Found Morningstar ID by ISIN: ${secId}`);
        }
      }

      // Fall back to name search
      if (!secId) {
        const fund = await searchFundByName(metadata.name);
        if (fund) {
          secId = fund.secId;
          console.log(`Found Morningstar ID by name: ${secId}`);
        }
      }

      if (!secId) {
        console.warn(`Could not find Morningstar ID for ${metadata.symbol}`);
        return this.createEmptyResult(this.name);
      }

      // Step 2: Fetch holdings using the secId
      const result = await this.fetchHoldingsBySecId(secId);
      return result;
    } catch (error) {
      console.error(`Error fetching Morningstar holdings for ${metadata.symbol}:`, error);
      return this.createEmptyResult(this.name);
    }
  }

  private async fetchHoldingsBySecId(secId: string): Promise<HoldingsResult> {
    try {
      // Try with extended ID format first (for OEICs)
      let url = `https://tools.morningstar.co.uk/api/rest.svc/9vehuxllxs/security/portfolio?id=${encodeURIComponent(secId + ']2]1]FOGBR$$ALL')}`;

      let response = await this.fetchWithRetry(url, {}, 1);

      // If 404, try without extended format (for ETFs)
      if (response.status === 404) {
        console.log(`Trying alternative format for ${secId}`);
        url = `https://tools.morningstar.co.uk/api/rest.svc/9vehuxllxs/security/portfolio?id=${encodeURIComponent(secId)}`;
        response = await this.fetchWithRetry(url, {}, 1);
      }

      if (!response.ok) {
        console.error(`Morningstar portfolio API error for ${secId}: ${response.status}`);
        return this.createEmptyResult(this.name);
      }

      const data = (await response.json()) as MorningstarPortfolioResponse;

      if (!data.EquityHolding || data.EquityHolding.length === 0) {
        console.warn(`No holdings data from Morningstar for ${secId}`);
        return this.createEmptyResult(this.name);
      }

      const holdings: FundHolding[] = data.EquityHolding.map((h) => ({
        symbol: h.Ticker,
        ticker: h.Ticker,
        name: h.SecurityName || 'Unknown',
        cusip: h.CUSIP,
        isin: h.ISIN,
        weightPercent: h.WeightingPercent || 0,
        shares: h.NumberOfShare,
        sharesHeld: h.NumberOfShare,
        value: h.MarketValue,
        marketValue: h.MarketValue,
        assetClass: 'Equity',
        assetType: 'Equity',
      }));

      // Use Date from response or default to today
      const asOfDate = data.Date ? this.parseDate(data.Date) : new Date().toISOString().split('T')[0];

      const dataQuality = this.determineDataQuality(holdings.length);

      console.log(`Successfully fetched ${holdings.length} holdings from Morningstar`);

      return {
        holdings,
        asOfDate,
        dataQuality,
        provider: this.name,
        totalHoldings: holdings.length,
      };
    } catch (error) {
      console.error(`Error fetching Morningstar holdings:`, error);
      return this.createEmptyResult(this.name);
    }
  }
}
