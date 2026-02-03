import {
  cacheFundHoldingsBatch,
  getLatestFundHoldings,
  hasRecentHoldings,
  type FundHoldingRow,
} from './db';
import type { FundHolding } from '@/types';

interface FinnhubHolding {
  symbol?: string;
  name: string;
  cusip?: string;
  isin?: string;
  percent?: number;
  share?: number;
  value?: number;
}

interface FinnhubHoldingsResponse {
  symbol: string;
  holdings: FinnhubHolding[];
  atDate?: string;
}

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

// Fetch holdings from Finnhub API
export async function fetchFinnhubHoldings(symbol: string): Promise<{
  holdings: FundHolding[];
  asOfDate: string;
} | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      console.error('FINNHUB_API_KEY not configured');
      return null;
    }

    // Clean symbol - remove .L suffix for London exchange
    const cleanSymbol = symbol.replace('.L', '');

    const url = `https://finnhub.io/api/v1/etf/holdings?symbol=${encodeURIComponent(cleanSymbol)}`;

    const response = await fetch(url, {
      headers: {
        'X-Finnhub-Token': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Finnhub rate limit exceeded');
      } else {
        console.error(`Finnhub API error for ${symbol}: ${response.status}`);
      }
      return null;
    }

    const data = (await response.json()) as FinnhubHoldingsResponse;

    if (!data.holdings || data.holdings.length === 0) {
      console.warn(`No holdings data from Finnhub for ${symbol}`);
      return null;
    }

    const holdings: FundHolding[] = data.holdings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      cusip: h.cusip,
      isin: h.isin,
      assetType: 'Equity',
      weightPercent: h.percent || 0,
      sharesHeld: h.share,
      marketValue: h.value,
    }));

    // Use atDate from response or default to today
    const asOfDate = data.atDate || new Date().toISOString().split('T')[0];

    return { holdings, asOfDate };
  } catch (error) {
    console.error(`Error fetching Finnhub holdings for ${symbol}:`, error);
    return null;
  }
}

// Fetch holdings from Morningstar Portfolio API
export async function fetchMorningstarHoldings(morningstarId: string): Promise<{
  holdings: FundHolding[];
  asOfDate: string;
} | null> {
  try {
    // Morningstar portfolio endpoint
    const extendedId = `${morningstarId}]2]1]FOGBR$$ALL`;
    const url = `https://tools.morningstar.co.uk/api/rest.svc/9vehuxllxs/security/portfolio?id=${encodeURIComponent(extendedId)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Morningstar portfolio API error for ${morningstarId}: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as MorningstarPortfolioResponse;

    if (!data.EquityHolding || data.EquityHolding.length === 0) {
      console.warn(`No holdings data from Morningstar for ${morningstarId}`);
      return null;
    }

    const holdings: FundHolding[] = data.EquityHolding.map((h) => ({
      symbol: h.Ticker,
      name: h.SecurityName || 'Unknown',
      cusip: h.CUSIP,
      isin: h.ISIN,
      assetType: 'Equity',
      weightPercent: h.WeightingPercent || 0,
      sharesHeld: h.NumberOfShare,
      marketValue: h.MarketValue,
    }));

    // Use Date from response or default to today
    const asOfDate = data.Date || new Date().toISOString().split('T')[0];

    return { holdings, asOfDate };
  } catch (error) {
    console.error(`Error fetching Morningstar holdings for ${morningstarId}:`, error);
    return null;
  }
}

// Smart orchestration with fallback chain
export async function fetchHoldingsWithFallback(
  symbol: string,
  options?: {
    morningstarId?: string;
    isETF?: boolean;
  }
): Promise<{
  holdings: FundHolding[];
  asOfDate: string;
} | null> {
  // Determine if this is likely an ETF based on symbol length (2-4 chars typically)
  const isLikelyETF = options?.isETF ?? symbol.replace('.L', '').length <= 4;

  // Try Finnhub first for ETFs
  if (isLikelyETF) {
    const finnhubResult = await fetchFinnhubHoldings(symbol);
    if (finnhubResult) {
      return finnhubResult;
    }
  }

  // Try Morningstar if morningstarId is available
  if (options?.morningstarId) {
    const morningstarResult = await fetchMorningstarHoldings(options.morningstarId);
    if (morningstarResult) {
      return morningstarResult;
    }
  }

  // Try Finnhub as last resort for non-ETFs
  if (!isLikelyETF) {
    const finnhubResult = await fetchFinnhubHoldings(symbol);
    if (finnhubResult) {
      return finnhubResult;
    }
  }

  return null;
}

// Batch fetch holdings for multiple funds with rate limiting
export async function fetchAllFundHoldings(
  funds: Array<{
    symbol: string;
    morningstarId?: string | null;
  }>
): Promise<Map<string, { holdings: FundHolding[]; asOfDate: string }>> {
  const results = new Map<string, { holdings: FundHolding[]; asOfDate: string }>();

  for (const fund of funds) {
    // Skip if we have recent cached data (within 7 days)
    if (hasRecentHoldings(fund.symbol, 7)) {
      console.log(`Using cached holdings for ${fund.symbol}`);
      const cachedHoldings = getLatestFundHoldings(fund.symbol);
      if (cachedHoldings.length > 0) {
        results.set(fund.symbol, {
          holdings: cachedHoldings.map((h) => ({
            symbol: h.holding_symbol || undefined,
            name: h.holding_name,
            cusip: h.cusip || undefined,
            isin: h.isin || undefined,
            assetType: h.asset_type || undefined,
            weightPercent: h.weight_percent,
            sharesHeld: h.shares_held || undefined,
            marketValue: h.market_value || undefined,
          })),
          asOfDate: cachedHoldings[0].as_of_date,
        });
        continue;
      }
    }

    // Fetch fresh data
    console.log(`Fetching holdings for ${fund.symbol}...`);
    const result = await fetchHoldingsWithFallback(fund.symbol, {
      morningstarId: fund.morningstarId || undefined,
    });

    if (result) {
      // Cache the results
      const holdingsToCache: Array<Omit<FundHoldingRow, 'id' | 'fetched_at'>> = result.holdings.map(
        (h) => ({
          fund_symbol: fund.symbol,
          holding_symbol: h.symbol || null,
          holding_name: h.name,
          cusip: h.cusip || null,
          isin: h.isin || null,
          asset_type: h.assetType || null,
          weight_percent: h.weightPercent,
          shares_held: h.sharesHeld || null,
          market_value: h.marketValue || null,
          as_of_date: result.asOfDate,
        })
      );

      cacheFundHoldingsBatch(holdingsToCache);
      results.set(fund.symbol, result);
      console.log(`Cached ${result.holdings.length} holdings for ${fund.symbol}`);
    } else {
      console.warn(`Failed to fetch holdings for ${fund.symbol}`);
    }

    // Rate limiting: 500ms delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

// Get cached holdings for a single fund
export function getCachedHoldings(fundSymbol: string): {
  holdings: FundHolding[];
  asOfDate: string;
} | null {
  const cachedHoldings = getLatestFundHoldings(fundSymbol);

  if (cachedHoldings.length === 0) {
    return null;
  }

  return {
    holdings: cachedHoldings.map((h) => ({
      symbol: h.holding_symbol || undefined,
      name: h.holding_name,
      cusip: h.cusip || undefined,
      isin: h.isin || undefined,
      assetType: h.asset_type || undefined,
      weightPercent: h.weight_percent,
      sharesHeld: h.shares_held || undefined,
      marketValue: h.market_value || undefined,
    })),
    asOfDate: cachedHoldings[0].as_of_date,
  };
}
