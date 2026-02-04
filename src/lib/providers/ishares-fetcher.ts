/**
 * iShares provider fetcher
 * Official BlackRock iShares API - complete holdings data
 */

import { BaseFetcher } from './base-fetcher';
import type { FundMetadata, HoldingsResult, FundHolding } from '@/types';

interface ISharesHolding {
  ticker?: string;
  name: string;
  isin?: string;
  weight: number;
  marketValue?: number;
  sharesHeld?: number;
  sector?: string;
  assetClass?: string;
  country?: string;
}

interface ISharesResponse {
  aaData: Array<{
    [key: string]: string | number;
  }>;
  asOfDate?: string;
  fundName?: string;
}

export class ISharesFetcher extends BaseFetcher {
  name = 'ishares';
  priority = 95;
  supportsFullHoldings = true;

  canHandle(metadata: FundMetadata): boolean {
    return metadata.name.toLowerCase().includes('ishares');
  }

  async fetchHoldings(metadata: FundMetadata): Promise<HoldingsResult> {
    try {
      // TODO: Research correct iShares API endpoint format
      // The current implementation doesn't have the right endpoint structure
      // For now, skip iShares and let it fall back to other providers
      console.log(`iShares provider not yet implemented - skipping`);
      return this.createEmptyResult(this.name);

      // Try multiple region endpoints
      // const regions = ['uk', 'us', 'de'];
      //
      // for (const region of regions) {
      //   const result = await this.tryRegion(metadata, region);
      //   if (result && result.holdings.length > 0) {
      //     return result;
      //   }
      // }
      //
      // console.warn(`Failed to fetch iShares holdings for ${metadata.symbol} from all regions`);
      // return this.createEmptyResult(this.name);
    } catch (error) {
      console.error(`Error fetching iShares holdings for ${metadata.symbol}:`, error);
      return this.createEmptyResult(this.name);
    }
  }

  private async tryRegion(metadata: FundMetadata, region: string): Promise<HoldingsResult | null> {
    try {
      // iShares API requires product ID, which we don't have
      // We need to search for the fund first or construct from ISIN
      const fundSlug = this.createFundSlug(metadata.name);

      // Try AJAX endpoint pattern
      const url = `https://www.ishares.com/${region}/individual/en/products/etf-investments.ajax?fileType=json&productView=all`;

      console.log(`Trying iShares ${region} for ${metadata.symbol}: ${url}`);

      const response = await this.fetchWithRetry(url, {}, 1);

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as ISharesResponse;

      if (!data.aaData || data.aaData.length === 0) {
        return null;
      }

      // Parse holdings from aaData array format
      const holdings: FundHolding[] = data.aaData.map((row) => ({
        name: String(row[0] || row.name || ''),
        symbol: row[1] ? String(row[1]) : undefined,
        ticker: row[1] ? String(row[1]) : undefined,
        isin: row.isin ? String(row.isin) : undefined,
        weightPercent: this.normalizeWeight(row[2] || row.weight || 0),
        sector: row.sector ? String(row.sector) : undefined,
        assetClass: row.assetClass ? String(row.assetClass) : 'Equity',
        assetType: row.assetClass ? String(row.assetClass) : 'Equity',
      })).filter(h => h.name && h.weightPercent > 0);

      if (holdings.length === 0) {
        return null;
      }

      const asOfDate = data.asOfDate
        ? this.parseDate(data.asOfDate)
        : new Date().toISOString().split('T')[0];

      const dataQuality = this.determineDataQuality(holdings.length);

      console.log(`Successfully fetched ${holdings.length} holdings from iShares ${region} for ${metadata.symbol}`);

      return {
        holdings,
        asOfDate,
        dataQuality,
        provider: this.name,
        totalHoldings: holdings.length,
      };
    } catch (error) {
      console.warn(`Failed to fetch from iShares ${region}:`, error);
      return null;
    }
  }

  private createFundSlug(name: string): string {
    // Convert fund name to URL slug format
    // "iShares MSCI World UCITS ETF" -> "ishares-msci-world-ucits-etf"
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Alternative: Try to fetch holdings by ISIN
   * iShares also supports direct ISIN lookup
   */
  private async fetchByISIN(isin: string, region: string): Promise<HoldingsResult | null> {
    try {
      const url = `https://www.ishares.com/${region}/individual/en/products/holdings.ajax?isin=${isin}&fileType=json`;

      const response = await this.fetchWithRetry(url, {}, 1);

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as ISharesResponse;

      if (!data.aaData || data.aaData.length === 0) {
        return null;
      }

      const holdings: FundHolding[] = data.aaData.map((row) => ({
        name: String(row[0] || ''),
        symbol: row[1] ? String(row[1]) : undefined,
        ticker: row[1] ? String(row[1]) : undefined,
        weightPercent: this.normalizeWeight(row[2] || 0),
      })).filter(h => h.name && h.weightPercent > 0);

      return {
        holdings,
        asOfDate: new Date().toISOString().split('T')[0],
        dataQuality: this.determineDataQuality(holdings.length),
        provider: this.name,
      };
    } catch {
      return null;
    }
  }
}
