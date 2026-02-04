import { NextResponse } from 'next/server';
import { parseHoldingsCSV } from '@/lib/csv-parser';
import {
  upsertHolding,
  clearHoldings,
  clearPriceCache,
  cacheFundHoldingsWithProvider,
  updateHoldingProviderInfo,
  logFetchAttempt,
} from '@/lib/db';
import { fetchAllHoldingsWithProgress } from '@/lib/providers/orchestrator';
import type { FundMetadata } from '@/types';

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

    // Step 1: Insert fund metadata
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

    // Step 2: Convert holdings to FundMetadata format
    const fundsMetadata: FundMetadata[] = holdings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      isin: h.isin,
      sedol: h.sedol,
      value: h.marketValue,
      quantity: h.quantity,
    }));

    // Step 3: Fetch holdings for all funds (BLOCKING)
    console.log(`\n=== Starting holdings fetch for ${fundsMetadata.length} funds ===\n`);

    const startTime = Date.now();

    const fetchResults = await fetchAllHoldingsWithProgress(
      fundsMetadata,
      (progress) => {
        // Log progress to console
        console.log(
          `[${progress.fundSymbol}] ${progress.status} - ${progress.provider}${
            progress.holdingsCount ? ` (${progress.holdingsCount} holdings)` : ''
          }${progress.error ? ` Error: ${progress.error}` : ''}`
        );
      }
    );

    // Step 4: Update metadata and log fetch attempts
    for (const result of fetchResults) {
      // Log fetch attempt
      logFetchAttempt({
        fund_symbol: result.symbol,
        provider: result.provider,
        status: result.status === 'success' ? 'success' : 'failed',
        holdings_count: result.holdingsCount,
        data_quality: result.dataQuality,
        error_message: result.error,
        response_time_ms: undefined, // Could be tracked in orchestrator
      });

      // Update holding with provider info
      updateHoldingProviderInfo(result.symbol, result.provider, result.dataQuality);
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n=== Holdings fetch completed in ${(totalTime / 1000).toFixed(1)}s ===\n`);

    // Step 5: Return results
    return NextResponse.json({
      success: true,
      fundsImported: holdings.length,
      holdings: holdings.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity,
        bookCost: h.bookCost,
        marketValue: h.marketValue,
      })),
      holdingsResults: fetchResults,
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
