/**
 * Financial Times (FT.com) scraper
 * Scrapes top 10 holdings from FT fund pages - works well for UK OEICs
 */

import { BaseFetcher } from './base-fetcher';
import type { FundMetadata, HoldingsResult, FundHolding } from '@/types';
import * as cheerio from 'cheerio';

export class FTScraperFetcher extends BaseFetcher {
  name = 'ft-scraper';
  priority = 70;
  supportsFullHoldings = false; // Top 10 only

  canHandle(metadata: FundMetadata): boolean {
    // FT works well for UK funds with ISIN
    return !!metadata.isin && metadata.isin.startsWith('GB');
  }

  async fetchHoldings(metadata: FundMetadata): Promise<HoldingsResult> {
    if (!metadata.isin) {
      return this.createEmptyResult(this.name);
    }

    try {
      // FT URL pattern: https://markets.ft.com/data/funds/tearsheet/holdings?s={ISIN}:GBP
      const url = `https://markets.ft.com/data/funds/tearsheet/holdings?s=${metadata.isin}:GBP`;

      console.log(`Fetching FT holdings for ${metadata.symbol}: ${url}`);

      const response = await this.fetchWithRetry(url, {}, 1);

      if (!response.ok) {
        console.warn(`FT scraper failed for ${metadata.symbol}: ${response.status}`);
        return this.createEmptyResult(this.name);
      }

      const html = await response.text();
      const holdings = this.parseHoldingsFromHTML(html);

      if (holdings.length === 0) {
        console.warn(`No holdings parsed from FT for ${metadata.symbol}`);
        return this.createEmptyResult(this.name);
      }

      // FT doesn't always provide as-of date, use today
      const asOfDate = this.extractAsOfDate(html) || new Date().toISOString().split('T')[0];

      const dataQuality = this.determineDataQuality(holdings.length);

      console.log(`Successfully scraped ${holdings.length} holdings from FT for ${metadata.symbol}`);

      return {
        holdings,
        asOfDate,
        dataQuality,
        provider: this.name,
        totalHoldings: holdings.length,
      };
    } catch (error) {
      console.error(`Error scraping FT holdings for ${metadata.symbol}:`, error);
      return this.createEmptyResult(this.name);
    }
  }

  private parseHoldingsFromHTML(html: string): FundHolding[] {
    const $ = cheerio.load(html);
    const holdings: FundHolding[] = [];

    // FT holdings table structure varies, try multiple selectors
    const tableSelectors = [
      'table.mod-tearsheet-holdings tbody tr',
      '.mod-ui-table--freeze-pane tbody tr',
      'table[data-mod-id="holdings"] tbody tr',
    ];

    for (const selector of tableSelectors) {
      const rows = $(selector);
      if (rows.length > 0) {
        rows.each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const name = $(cells[0]).text().trim();
            const weightText = $(cells[1]).text().trim();
            const weight = this.parseWeight(weightText);

            if (name && weight > 0) {
              holdings.push({
                name,
                weightPercent: weight,
                assetClass: 'Equity',
                assetType: 'Equity',
              });
            }
          }
        });

        if (holdings.length > 0) {
          break; // Found holdings, stop trying other selectors
        }
      }
    }

    return holdings;
  }

  private parseWeight(weightText: string): number {
    try {
      // Remove %, commas, and other non-numeric chars except decimal point
      const cleaned = weightText.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    } catch {
      return 0;
    }
  }

  private extractAsOfDate(html: string): string | null {
    const $ = cheerio.load(html);

    // Try to find "as of" date in various formats
    const dateSelectors = [
      '.mod-tearsheet-overview__aso',
      '.mod-disclaimer time',
      '[data-mod-id="as-of-date"]',
    ];

    for (const selector of dateSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
        if (dateMatch) {
          return this.parseDate(dateMatch[0]);
        }
      }
    }

    return null;
  }
}
