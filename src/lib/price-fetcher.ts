import { cachePricesBatch, getCachedPrices, getLatestCachedDate, updateHoldingMorningstarId } from './db';
import { format, subYears, parseISO, addDays } from 'date-fns';
import { fetchMorningstarPrices } from './morningstar-fetcher';

// Map ii.co.uk symbols/SEDOLs to Yahoo Finance symbols
// Only includes ETFs with real London Stock Exchange tickers
// UK OEICs use Morningstar instead (the 0P... symbols don't work on Yahoo)
const SYMBOL_TO_YAHOO: Record<string, string> = {
  // ETFs (ticker symbols) - these have real LSE tickers
  'IWRD': 'IWRD.L',
  'IJPH': 'IJPH.L',
  'SMT': 'SMT.L',
  'JGGI': 'JGGI.L',
  'CTY': 'CTY.L',

  // ETF alternative SEDOLs
  'BLDYK61': 'SMT.L',          // Scottish Mortgage (same as ticker)
  'B0M62Q5': 'IWRD.L',         // iShares MSCI World (same as ticker)
  'B7XYN97': 'IJPH.L',         // iShares Japan Hedged (same as ticker)
  'BYMKY69': 'JGGI.L',         // JPMorgan Global Growth (same as ticker)

  // Note: UK OEICs (funds like BlackRock, Vanguard, Fidelity, etc.)
  // use Morningstar API instead - the Yahoo 0P... symbols no longer work
};

export function getYahooSymbol(symbol: string, sedol?: string): string | null {
  // Try symbol first
  if (SYMBOL_TO_YAHOO[symbol]) {
    return SYMBOL_TO_YAHOO[symbol];
  }

  // Try sedol
  if (sedol && SYMBOL_TO_YAHOO[sedol]) {
    return SYMBOL_TO_YAHOO[sedol];
  }

  // If it looks like a London ticker, append .L
  if (/^[A-Z]{2,4}$/.test(symbol)) {
    return `${symbol}.L`;
  }

  return null;
}

interface YahooChartResult {
  timestamp: number[];
  indicators: {
    quote: Array<{
      close: (number | null)[];
    }>;
  };
  meta: {
    currency: string;
  };
}

// Convert from pence to pounds if needed
function convertToGBP(price: number, currency: string | undefined): number {
  if (!currency) return price;
  if (currency === 'GBp' || currency === 'GBX' || currency === 'GBx') {
    return price / 100;
  }
  return price;
}

export async function fetchHistoricalPrices(
  yahooSymbol: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; price: number }>> {
  try {
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?period1=${period1}&period2=${period2}&interval=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error for ${yahooSymbol}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const result: YahooChartResult = data.chart?.result?.[0];

    if (!result || !result.timestamp) {
      console.error(`No data returned for ${yahooSymbol}`);
      return [];
    }

    const timestamps = result.timestamp;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const currency = result.meta?.currency;

    const prices: Array<{ date: string; price: number }> = [];

    for (let i = 0; i < timestamps.length; i++) {
      const closePrice = closes[i];
      if (closePrice !== null && closePrice !== undefined) {
        const date = format(new Date(timestamps[i] * 1000), 'yyyy-MM-dd');
        const priceInGBP = convertToGBP(closePrice, currency);
        prices.push({ date, price: priceInGBP });
      }
    }

    return prices;
  } catch (error) {
    console.error(`Error fetching prices for ${yahooSymbol}:`, error);
    return [];
  }
}

export async function fetchAndCachePrices(
  symbol: string,
  sedol: string | undefined,
  yearsBack: number = 15,
  options?: {
    name?: string;
    isin?: string;
    morningstarId?: string;
  }
): Promise<Array<{ date: string; price: number }>> {
  // Check what we already have cached
  const latestCached = getLatestCachedDate(symbol);
  const today = new Date();

  let startDate: Date;
  if (latestCached) {
    // Fetch from day after latest cached
    startDate = addDays(parseISO(latestCached), 1);
  } else {
    // Fetch from N years ago
    startDate = subYears(today, yearsBack);
  }

  // Only fetch if we need new data
  if (startDate >= today) {
    return getCachedPrices(symbol);
  }

  let newPrices: Array<{ date: string; price: number }> = [];
  const yahooSymbol = getYahooSymbol(symbol, sedol);

  // Determine if this is an OEIC (fund) or ETF based on symbol format
  // OEICs typically have SEDOL-style symbols (7 chars, alphanumeric) while ETFs have 2-4 letter tickers
  const isLikelyOEIC = /^[A-Z0-9]{7}$/.test(symbol) || /^[0-9]+$/.test(symbol);

  // For OEICs, try Morningstar first (Yahoo 0P... symbols no longer work)
  if (isLikelyOEIC && options?.name) {
    console.log(`Trying Morningstar for OEIC ${symbol} from ${format(startDate, 'yyyy-MM-dd')}`);
    const { prices, secId } = await fetchMorningstarPrices(
      options.name,
      options.isin,
      startDate,
      today
    );
    newPrices = prices;

    // Cache the Morningstar ID for future lookups
    if (secId) {
      updateHoldingMorningstarId(symbol, secId);
    }
  }

  // For ETFs (or if Morningstar failed), try Yahoo Finance
  if (newPrices.length === 0 && yahooSymbol) {
    console.log(`Trying Yahoo Finance for ${symbol} (${yahooSymbol}) from ${format(startDate, 'yyyy-MM-dd')}`);
    newPrices = await fetchHistoricalPrices(yahooSymbol, startDate, today);
  }

  // Final fallback: try Morningstar for ETFs that Yahoo might not have
  if (newPrices.length === 0 && options?.name && !isLikelyOEIC) {
    console.log(`Yahoo Finance failed for ${symbol}, trying Morningstar as fallback...`);
    const { prices, secId } = await fetchMorningstarPrices(
      options.name,
      options.isin,
      startDate,
      today
    );
    newPrices = prices;

    if (secId) {
      updateHoldingMorningstarId(symbol, secId);
    }
  }

  if (newPrices.length > 0) {
    // Cache new prices
    cachePricesBatch(
      newPrices.map((p) => ({ symbol, date: p.date, price: p.price }))
    );
    console.log(`Cached ${newPrices.length} prices for ${symbol}`);
  } else {
    console.warn(`No price data found for ${symbol} from any source`);
  }

  // Return all cached prices
  return getCachedPrices(symbol);
}

export async function fetchAllHoldingsPrices(
  holdings: Array<{
    symbol: string;
    sedol?: string;
    name?: string;
    isin?: string;
    morningstar_id?: string;
  }>,
  yearsBack: number = 15
): Promise<Map<string, Array<{ date: string; price: number }>>> {
  const allPrices = new Map<string, Array<{ date: string; price: number }>>();

  for (const holding of holdings) {
    const prices = await fetchAndCachePrices(
      holding.symbol,
      holding.sedol,
      yearsBack,
      {
        name: holding.name,
        isin: holding.isin,
        morningstarId: holding.morningstar_id,
      }
    );
    allPrices.set(holding.symbol, prices);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return allPrices;
}
