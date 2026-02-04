/**
 * Test the full import flow including holdings fetching
 */

import { readFileSync } from 'fs';
import { parseHoldingsCSV } from '../src/lib/csv-parser';
import { fetchAllHoldingsWithProgress } from '../src/lib/providers/orchestrator';
import type { FundMetadata } from '../src/types';

async function testImportFlow() {
  console.log('=== Testing Full Import Flow ===\n');

  // Step 1: Load and parse CSV
  const csvContent = readFileSync('/Users/fez/Desktop/ii-dashboard/test-import.csv', 'utf-8');
  const { holdings, errors } = parseHoldingsCSV(csvContent);

  console.log(`Parsed ${holdings.length} funds from CSV`);
  if (errors.length > 0) {
    console.log('Parse errors:', errors);
  }

  // Step 2: Convert to FundMetadata
  const fundsMetadata: FundMetadata[] = holdings.map((h) => ({
    symbol: h.symbol,
    name: h.name,
    isin: h.isin,
    sedol: h.sedol,
    value: h.marketValue,
    quantity: h.quantity,
  }));

  console.log('\nFunds to fetch:');
  fundsMetadata.forEach((f) => {
    console.log(`  - ${f.symbol}: ${f.name} (ISIN: ${f.isin || 'N/A'})`);
  });

  // Step 3: Fetch holdings with progress
  console.log('\n=== Starting Holdings Fetch ===\n');

  const results = await fetchAllHoldingsWithProgress(fundsMetadata, (progress) => {
    const statusEmoji = {
      pending: '⏳',
      trying: '🔄',
      success: '✅',
      failed: '❌',
    }[progress.status];

    console.log(
      `${statusEmoji} [${progress.fundSymbol}] ${progress.provider}${
        progress.holdingsCount ? ` - ${progress.holdingsCount} holdings (${progress.dataQuality})` : ''
      }${progress.error ? ` - ${progress.error}` : ''}`
    );
  });

  // Step 4: Display results
  console.log('\n=== Import Results ===\n');

  results.forEach((result) => {
    console.log(`\n${result.symbol} - ${result.name}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Provider: ${result.provider}`);
    console.log(`  Holdings: ${result.holdingsCount}`);
    console.log(`  Data Quality: ${result.dataQuality}`);
    console.log(`  Attempted: ${result.attemptedProviders.join(', ')}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  // Summary
  const successful = results.filter((r) => r.status === 'success').length;
  const complete = results.filter((r) => r.dataQuality === 'complete').length;
  const partial = results.filter((r) => r.dataQuality === 'partial').length;

  console.log('\n=== Summary ===');
  console.log(`Total funds: ${results.length}`);
  console.log(`Successful: ${successful}/${results.length} (${((successful / results.length) * 100).toFixed(0)}%)`);
  console.log(`Complete data: ${complete}`);
  console.log(`Partial data: ${partial}`);
  console.log(`No data: ${results.length - successful}`);
}

testImportFlow().catch(console.error);
