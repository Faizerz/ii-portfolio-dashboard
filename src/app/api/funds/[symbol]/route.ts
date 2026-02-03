import { NextResponse } from 'next/server';
import { getHolding, getCachedPrices } from '@/lib/db';
import { fetchAndCachePrices, getYahooSymbol } from '@/lib/price-fetcher';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const decodedSymbol = decodeURIComponent(symbol);

    const holding = getHolding(decodedSymbol);

    if (!holding) {
      return NextResponse.json(
        { error: 'Fund not found' },
        { status: 404 }
      );
    }

    // Fetch and cache prices if we have a Yahoo symbol
    const yahooSymbol = getYahooSymbol(holding.symbol, holding.sedol);
    let priceHistory: Array<{ date: string; price: number }> = [];

    if (yahooSymbol) {
      await fetchAndCachePrices(holding.symbol, holding.sedol, 5);
      priceHistory = getCachedPrices(holding.symbol);
    }

    // Calculate value history (quantity * price over time)
    const valueHistory = priceHistory.map((p) => ({
      date: p.date,
      value: holding.quantity * p.price,
    }));

    return NextResponse.json({
      symbol: holding.symbol,
      sedol: holding.sedol,
      name: holding.name,
      quantity: holding.quantity,
      bookCost: holding.book_cost,
      currentPrice: holding.current_price,
      marketValue: holding.market_value,
      gainLoss: holding.market_value - holding.book_cost,
      gainLossPercent: ((holding.market_value - holding.book_cost) / holding.book_cost) * 100,
      hasYahooSymbol: !!yahooSymbol,
      priceHistory,
      valueHistory,
    });
  } catch (error) {
    console.error('Error fetching fund details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fund details' },
      { status: 500 }
    );
  }
}
