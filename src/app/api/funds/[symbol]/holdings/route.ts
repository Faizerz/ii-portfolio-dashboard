import { NextResponse } from 'next/server';
import { getHolding, hasRecentHoldings } from '@/lib/db';
import {
  fetchHoldingsWithFallback,
  getCachedHoldings,
} from '@/lib/holdings-fetcher';
import { cacheFundHoldingsBatch, type FundHoldingRow } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const decodedSymbol = decodeURIComponent(symbol);

    const holding = getHolding(decodedSymbol);

    if (!holding) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
    }

    // Check if we have recent cached holdings (within 7 days)
    if (hasRecentHoldings(decodedSymbol, 7)) {
      const cached = getCachedHoldings(decodedSymbol);
      if (cached) {
        const topHoldings = cached.holdings.slice(0, 10);
        return NextResponse.json({
          fundSymbol: decodedSymbol,
          fundName: holding.name,
          asOfDate: cached.asOfDate,
          numberOfHoldings: cached.holdings.length,
          holdings: cached.holdings,
          topHoldings,
        });
      }
    }

    // Fetch fresh holdings data
    const result = await fetchHoldingsWithFallback(decodedSymbol, {
      morningstarId: holding.morningstar_id || undefined,
    });

    if (!result) {
      return NextResponse.json({
        fundSymbol: decodedSymbol,
        fundName: holding.name,
        asOfDate: null,
        numberOfHoldings: 0,
        holdings: [],
        topHoldings: [],
        message: 'Holdings data not available',
      });
    }

    // Cache the results
    const holdingsToCache: Array<Omit<FundHoldingRow, 'id' | 'fetched_at'>> =
      result.holdings.map((h) => ({
        fund_symbol: decodedSymbol,
        holding_symbol: h.symbol || null,
        holding_name: h.name,
        cusip: h.cusip || null,
        isin: h.isin || null,
        asset_type: h.assetType || null,
        weight_percent: h.weightPercent,
        shares_held: h.sharesHeld || null,
        market_value: h.marketValue || null,
        as_of_date: result.asOfDate,
      }));

    cacheFundHoldingsBatch(holdingsToCache);

    const topHoldings = result.holdings.slice(0, 10);

    return NextResponse.json({
      fundSymbol: decodedSymbol,
      fundName: holding.name,
      asOfDate: result.asOfDate,
      numberOfHoldings: result.holdings.length,
      holdings: result.holdings,
      topHoldings,
    });
  } catch (error) {
    console.error('Error fetching fund holdings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fund holdings' },
      { status: 500 }
    );
  }
}
