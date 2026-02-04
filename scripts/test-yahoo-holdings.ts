import YahooFinanceConstructor from 'yahoo-finance2';

const yahooFinance = new YahooFinanceConstructor();

async function testYahooHoldings() {
  const symbols = [
    'IWRD.L',  // iShares MSCI World
    'IJPH.L',  // iShares MSCI Japan
    'SMT.L',   // Scottish Mortgage
  ];

  for (const symbol of symbols) {
    console.log(`\n=== Testing ${symbol} ===`);

    try {
      // Try quoteSummary with fundProfile and topHoldings modules
      const result = await yahooFinance.quoteSummary(symbol, {
        modules: ['fundProfile', 'topHoldings', 'fundOwnership']
      });

      console.log('Available modules:', Object.keys(result));

      if (result.topHoldings) {
        console.log('\nTop Holdings Object:', JSON.stringify(result.topHoldings, null, 2));
      } else {
        console.log('No topHoldings data available');
      }

      if (result.fundProfile) {
        console.log('\nFund Profile available:', !!result.fundProfile);
      }

    } catch (error: any) {
      console.error('Error:', error.message);
    }

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testYahooHoldings().catch(console.error);
