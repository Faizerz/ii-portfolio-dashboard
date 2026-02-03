import { NextResponse } from 'next/server';
import { parseHoldingsCSV } from '@/lib/csv-parser';
import { upsertHolding, clearHoldings, clearPriceCache } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const { holdings, errors } = parseHoldingsCSV(content);

    if (holdings.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid holdings found in file',
          errors,
        },
        { status: 400 }
      );
    }

    // Clear existing holdings and reimport
    clearHoldings();
    // Also clear price cache to refetch fresh data
    clearPriceCache();

    // Insert holdings
    for (const holding of holdings) {
      upsertHolding({
        symbol: holding.symbol,
        sedol: holding.sedol,
        isin: holding.isin,
        morningstarId: null,
        name: holding.name,
        quantity: holding.quantity,
        bookCost: holding.bookCost,
        currentPrice: holding.currentPrice,
        marketValue: holding.marketValue,
      });
    }

    return NextResponse.json({
      success: true,
      imported: holdings.length,
      holdings: holdings.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity,
        bookCost: h.bookCost,
        marketValue: h.marketValue,
      })),
      errors,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to import CSV file', details: message },
      { status: 500 }
    );
  }
}
