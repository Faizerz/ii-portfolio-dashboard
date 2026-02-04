/**
 * Test script for provider detection and fetching
 */

import { detectProviders } from '../src/lib/providers/detector';
import { fetchHoldingsWithProviders } from '../src/lib/providers/orchestrator';
import type { FundMetadata } from '../src/types';

// Test funds representing different types
const testFunds: FundMetadata[] = [
  {
    symbol: 'IWRD',
    name: 'iShares MSCI World UCITS ETF',
    isin: 'IE00B4L5Y983',
    sedol: 'B4L5Y98',
  },
  {
    symbol: 'IJPH',
    name: 'iShares MSCI Japan ESG Enhanced UCITS ETF',
    isin: 'IE00BHZPJ890',
    sedol: 'BHZPJ89',
  },
  {
    symbol: 'B4VY989',
    name: 'BlackRock Continental European Income Fund',
    isin: 'GB00B4VY9894',
    sedol: 'B4VY989',
  },
];

async function testProviderDetection() {
  console.log('=== Testing Provider Detection ===\n');

  for (const fund of testFunds) {
    console.log(`\n--- ${fund.symbol}: ${fund.name} ---`);
    const detection = detectProviders(fund);

    console.log('Detected providers (by confidence):');
    detection.providers.forEach((p) => {
      console.log(`  - ${p.provider}: ${p.confidence}% (${p.region}, ${p.fundType})`);
    });

    console.log('Detection signals:', detection.signals);
  }
}

async function testFetching() {
  console.log('\n\n=== Testing Holdings Fetching ===\n');

  // Test with the first fund
  const fund = testFunds[0];

  console.log(`\nFetching holdings for ${fund.symbol}...`);

  const result = await fetchHoldingsWithProviders(fund, (progress) => {
    console.log(`  [${progress.status}] ${progress.provider}${
      progress.error ? ` - Error: ${progress.error}` : ''
    }${
      progress.holdingsCount ? ` - ${progress.holdingsCount} holdings (${progress.dataQuality})` : ''
    }`);
  });

  console.log('\n--- Result ---');
  console.log(`Provider: ${result.provider}`);
  console.log(`Data Quality: ${result.dataQuality}`);
  console.log(`As of Date: ${result.asOfDate}`);
  console.log(`Holdings Count: ${result.holdings.length}`);

  if (result.holdings.length > 0) {
    console.log('\nTop 5 Holdings:');
    result.holdings.slice(0, 5).forEach((h, i) => {
      console.log(`  ${i + 1}. ${h.name} - ${h.weightPercent.toFixed(2)}%`);
    });
  }
}

async function main() {
  try {
    await testProviderDetection();
    await testFetching();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
