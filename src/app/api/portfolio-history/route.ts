import { NextResponse } from 'next/server';
import { getAllHoldings } from '@/lib/db';
import { fetchAllHoldingsPrices, getYahooSymbol } from '@/lib/price-fetcher';

export async function GET() {
  try {
    const holdings = getAllHoldings();

    if (holdings.length === 0) {
      return NextResponse.json({
        holdings: [],
        portfolioHistory: [],
        fundPerformance: [],
        summary: null,
      });
    }

    // Fetch historical prices for all holdings (15 years back)
    const pricesMap = await fetchAllHoldingsPrices(
      holdings.map((h) => ({
        symbol: h.symbol,
        sedol: h.sedol,
        name: h.name,
        isin: h.isin || undefined,
        morningstar_id: h.morningstar_id || undefined,
      })),
      15
    );

    // Get all unique dates across all funds
    const allDates = new Set<string>();
    pricesMap.forEach((prices) => {
      prices.forEach((p) => allDates.add(p.date));
    });
    const sortedDates = Array.from(allDates).sort();

    // Build price lookup maps for each fund
    const priceLookup = new Map<string, Map<string, number>>();
    pricesMap.forEach((prices, symbol) => {
      const lookup = new Map<string, number>();
      prices.forEach((p) => lookup.set(p.date, p.price));
      priceLookup.set(symbol, lookup);
    });

    // Calculate portfolio value and fund performance for each date
    const portfolioHistory: Array<{ date: string; value: number; invested: number }> = [];
    const fundPerformanceByDate: Array<{ date: string; [symbol: string]: number | string }> = [];

    // Track last known prices for interpolation
    const lastPrices = new Map<string, number>();

    for (const date of sortedDates) {
      let totalValue = 0;
      let totalInvested = 0;
      const fundGains: { date: string; [symbol: string]: number | string } = { date };

      for (const holding of holdings) {
        const priceMap = priceLookup.get(holding.symbol);
        let price = priceMap?.get(date);

        // Use last known price if no price for this date
        if (price === undefined) {
          price = lastPrices.get(holding.symbol);
        } else {
          lastPrices.set(holding.symbol, price);
        }

        if (price !== undefined) {
          const value = holding.quantity * price;
          totalValue += value;
          totalInvested += holding.book_cost;

          // Calculate % gain/loss for this fund
          const gainPercent = ((value - holding.book_cost) / holding.book_cost) * 100;
          fundGains[holding.symbol] = gainPercent;
        }
      }

      if (totalValue > 0) {
        portfolioHistory.push({
          date,
          value: totalValue,
          invested: totalInvested,
        });
        fundPerformanceByDate.push(fundGains);
      }
    }

    // Calculate current summary
    const totalInvested = holdings.reduce((sum, h) => sum + h.book_cost, 0);
    const totalValue = holdings.reduce((sum, h) => sum + h.market_value, 0);

    // Build holdings response with Yahoo symbol status
    const holdingsResponse = holdings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      bookCost: h.book_cost,
      currentPrice: h.current_price,
      marketValue: h.market_value,
      gainLoss: h.market_value - h.book_cost,
      gainLossPercent: ((h.market_value - h.book_cost) / h.book_cost) * 100,
      hasYahooSymbol: !!getYahooSymbol(h.symbol, h.sedol),
    }));

    return NextResponse.json({
      holdings: holdingsResponse,
      portfolioHistory,
      fundPerformance: fundPerformanceByDate,
      fundNames: holdings.map((h) => h.symbol),
      fundLabels: Object.fromEntries(holdings.map((h) => [h.symbol, h.name])),
      summary: {
        totalValue,
        totalInvested,
        gainLoss: totalValue - totalInvested,
        gainLossPercent: ((totalValue - totalInvested) / totalInvested) * 100,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio history' },
      { status: 500 }
    );
  }
}
