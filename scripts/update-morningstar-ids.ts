import { getAllHoldings, updateHoldingMorningstarId, getDb } from '../src/lib/db';
import { autoDetectMorningstarId } from '../src/lib/morningstar-fetcher';

async function updateMissingMorningstarIds() {
  console.log('Checking for missing Morningstar IDs...\n');

  const holdings = getAllHoldings();
  const missingIds = holdings.filter((h) => !h.morningstar_id);

  if (missingIds.length === 0) {
    console.log('All holdings already have Morningstar IDs!');
    return;
  }

  console.log(`Found ${missingIds.length} holdings without Morningstar IDs:\n`);

  for (const holding of missingIds) {
    console.log(`Searching for: ${holding.name} (${holding.symbol})`);
    console.log(`  ISIN: ${holding.isin || 'N/A'}`);

    const result = await autoDetectMorningstarId(holding.name, holding.isin || undefined);

    if (result) {
      console.log(`  ✓ Found: ${result.secId} - ${result.name}`);
      updateHoldingMorningstarId(holding.symbol, result.secId);
      console.log(`  ✓ Updated database\n`);
    } else {
      console.log(`  ✗ No Morningstar ID found\n`);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\nDone! Updated Morningstar IDs.');
}

// Run the script
updateMissingMorningstarIds().catch(console.error);
