import { format } from 'date-fns';

export interface MorningstarFund {
  secId: string;
  name: string;
  isin?: string;
  ticker?: string;
  exchange?: string;
}

export interface MorningstarPrice {
  date: string;
  price: number;
}

// Search for funds using Morningstar's UK search endpoint
export async function searchFund(query: string): Promise<MorningstarFund[]> {
  try {
    const url = `https://www.morningstar.co.uk/uk/util/SecuritySearch.ashx?q=${encodeURIComponent(query)}&limit=25&preferedList=&source=nav`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Morningstar search error: ${response.status}`);
      return [];
    }

    const text = await response.text();

    // Response format has changed - now includes JSON:
    // "name|{json}|type|||category" or category header lines like "Funds and Trusts|||"
    const lines = text.trim().split('\n');
    const funds: MorningstarFund[] = [];

    for (const line of lines) {
      const parts = line.split('|');
      // Skip category headers and "More..." lines
      if (parts.length < 2 || !parts[1] || parts[1].includes('More ')) {
        continue;
      }

      // Try to parse JSON in the second field (new format)
      try {
        const jsonStr = parts[1];
        if (jsonStr.startsWith('{')) {
          const data = JSON.parse(jsonStr);
          // Skip articles (type -1) and other non-fund results
          if (data.i && data.t !== -1) {
            funds.push({
              secId: data.i,
              name: data.n || parts[0] || '',
              ticker: data.s || undefined,
              isin: undefined,
              exchange: undefined,
            });
            continue;
          }
        }
      } catch {
        // Not JSON, try old format
      }

      // Old format fallback: "secId|name|ticker|isin|exchange|..."
      if (parts.length >= 4 && parts[0] && !parts[0].includes(' ')) {
        funds.push({
          secId: parts[0],
          name: parts[1] || '',
          ticker: parts[2] || undefined,
          isin: parts[3] || undefined,
          exchange: parts[4] || undefined,
        });
      }
    }

    return funds;
  } catch (error) {
    console.error('Error searching Morningstar:', error);
    return [];
  }
}

// Search by ISIN - more reliable for UK funds
export async function searchFundByISIN(isin: string): Promise<MorningstarFund | null> {
  const funds = await searchFund(isin);
  // Find exact ISIN match
  const match = funds.find((f) => f.isin === isin);
  return match || funds[0] || null;
}

// Search by name with fuzzy matching
export async function searchFundByName(name: string): Promise<MorningstarFund | null> {
  // Try searching with the full name first
  let funds = await searchFund(name);
  if (funds.length > 0) {
    return funds[0];
  }

  // Try with simplified name (remove common suffixes)
  const simplifiedName = name
    .replace(/\s*(Acc|Inc|Class\s*\w|GBP|USD|EUR|Hedged|Unhedged)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (simplifiedName !== name) {
    funds = await searchFund(simplifiedName);
    if (funds.length > 0) {
      return funds[0];
    }
  }

  // Try with just the fund provider name and key words
  const words = name.split(/\s+/).slice(0, 3).join(' ');
  if (words !== simplifiedName) {
    funds = await searchFund(words);
    if (funds.length > 0) {
      return funds[0];
    }
  }

  return null;
}

// Fetch historical NAV data from Morningstar
export async function fetchMorningstarHistoricalNAV(
  secId: string,
  startDate: Date,
  endDate: Date
): Promise<MorningstarPrice[]> {
  try {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    // Morningstar API endpoint for historical prices
    // The ID format needs to include security type and universe: secId]2]1]FOGBR$$ALL
    const extendedId = `${secId}]2]1]FOGBR$$ALL`;
    const url = `https://tools.morningstar.co.uk/api/rest.svc/timeseries_price/t92wz0sj7c?currencyId=GBP&idtype=Morningstar&id=${encodeURIComponent(extendedId)}&startDate=${startStr}&endDate=${endStr}&outputType=JSON`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Morningstar NAV fetch error for ${secId}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Response format varies - handle different structures
    let timeSeries: Array<[number, number]> = [];

    if (Array.isArray(data)) {
      timeSeries = data;
    } else if (data.TimeSeries?.Security?.[0]?.HistoryDetail) {
      // HistoryDetail response format - Value is a string
      const details = data.TimeSeries.Security[0].HistoryDetail;
      timeSeries = details.map((d: { EndDate: string; Value: string }) => [
        new Date(d.EndDate).getTime(),
        parseFloat(d.Value),
      ]);
    } else if (data.TimeSeries?.Security?.[0]?.CumulativeReturn) {
      // Sometimes it returns cumulative returns instead
      console.warn(`Morningstar returned cumulative returns for ${secId}, not NAV`);
      return [];
    }

    const prices: MorningstarPrice[] = [];
    for (const [timestamp, nav] of timeSeries) {
      if (typeof timestamp === 'number' && typeof nav === 'number' && nav > 0) {
        const date = format(new Date(timestamp), 'yyyy-MM-dd');
        prices.push({ date, price: nav });
      }
    }

    return prices;
  } catch (error) {
    console.error(`Error fetching Morningstar NAV for ${secId}:`, error);
    return [];
  }
}

// Auto-detect Morningstar ID using ISIN or name
export async function autoDetectMorningstarId(
  name: string,
  isin?: string
): Promise<{ secId: string; name: string } | null> {
  // Try ISIN first (most reliable)
  if (isin) {
    const fund = await searchFundByISIN(isin);
    if (fund) {
      console.log(`Found Morningstar secId for ISIN ${isin}: ${fund.secId}`);
      return { secId: fund.secId, name: fund.name };
    }
  }

  // Fall back to name search
  const fund = await searchFundByName(name);
  if (fund) {
    console.log(`Found Morningstar secId for "${name}": ${fund.secId}`);
    return { secId: fund.secId, name: fund.name };
  }

  console.warn(`Could not find Morningstar secId for "${name}" (ISIN: ${isin || 'none'})`);
  return null;
}

// Fetch historical prices for a fund, auto-detecting the Morningstar ID
export async function fetchMorningstarPrices(
  name: string,
  isin: string | undefined,
  startDate: Date,
  endDate: Date
): Promise<{ prices: MorningstarPrice[]; secId: string | null }> {
  const fund = await autoDetectMorningstarId(name, isin);

  if (!fund) {
    return { prices: [], secId: null };
  }

  const prices = await fetchMorningstarHistoricalNAV(fund.secId, startDate, endDate);
  return { prices, secId: fund.secId };
}
