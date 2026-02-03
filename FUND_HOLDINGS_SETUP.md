# Fund Holdings Feature - Setup & Testing Guide

## Overview

The fund holdings feature has been successfully implemented! This feature adds underlying portfolio composition data for all funds, showing what stocks/securities each fund actually holds.

## What's New

### Features Added
1. **Database Layer**: New `fund_holdings` table with automatic migration
2. **API Integration**:
   - Finnhub ETF Holdings API (primary source for ETFs)
   - Morningstar Portfolio API (fallback for UK OEICs)
3. **Smart Caching**: 7-day cache to minimize API calls
4. **UI Components**:
   - Portfolio composition pie chart (top 10 holdings)
   - Holdings table with weight visualization bars
5. **Fund Detail Page**: Integrated holdings display with as-of dates

### Files Created
- `/src/lib/holdings-fetcher.ts` - API integration layer
- `/src/app/api/funds/[symbol]/holdings/route.ts` - Holdings API endpoint
- `/src/components/charts/holdings-pie-chart.tsx` - Pie chart visualization
- `/src/components/tables/holdings-composition-table.tsx` - Holdings table
- `.env.example` - Environment configuration template

### Files Modified
- `/src/lib/db.ts` - Added fund_holdings table and CRUD functions
- `/src/types/index.ts` - Added FundHolding and FundHoldingsData interfaces
- `/src/app/funds/[symbol]/page.tsx` - Integrated holdings display
- `.gitignore` - Ensured .env.example is tracked

## Setup Instructions

### 1. Get Finnhub API Key

The free tier is sufficient for this feature:
- Visit: https://finnhub.io/register
- Sign up for a free account
- Copy your API key from the dashboard
- Free tier limits: 30 calls/sec, 60 calls/min (plenty for 9 funds)

### 2. Configure Environment

Edit `.env.local` (already created) and add your API key:

```bash
FINNHUB_API_KEY=your_actual_api_key_here
```

**Important**: The app will still work without this key, but holdings data won't be fetched. Morningstar fallback will be attempted for funds with Morningstar IDs.

### 3. Start Development Server

```bash
npm run dev
```

The database migration will run automatically on first request.

### 4. Test the Feature

Navigate to any fund detail page:
```
http://localhost:3000/funds/IWRD
http://localhost:3000/funds/IJPH
http://localhost:3000/funds/SMT
```

You should see two new sections:
- **Portfolio Composition** (pie chart)
- **Top Holdings** (table with weight bars)

## How It Works

### Data Sources

1. **ETFs** (IWRD, IJPH, SMT): Finnhub API
   - Usually has 100-2700+ holdings
   - Updates available daily

2. **UK OEICs** (BlackRock, Fidelity, Vanguard): Morningstar API
   - Typically 50-200 holdings
   - Uses existing Morningstar integration

### Caching Strategy

- Holdings are cached for **7 days** after first fetch
- Database check happens before API calls
- Only fetches if cache is stale or missing
- Lazy loading: fetches on-demand per fund

### Rate Limiting

- 500ms delay between batch requests
- Sequential processing (not parallel)
- 9 funds × 500ms = ~5 seconds for full batch fetch

## Testing Checklist

### Basic Functionality
- [ ] Navigate to fund detail page (e.g., `/funds/IWRD`)
- [ ] Verify pie chart appears with top 10 holdings
- [ ] Verify holdings table shows with weight bars
- [ ] Check "as of date" is displayed
- [ ] Click "Show All Holdings" button to expand table
- [ ] Verify sorting works (click column headers)

### Different Fund Types
- [ ] Test ETF: IWRD (should use Finnhub)
- [ ] Test Investment Trust: SMT (should use Finnhub)
- [ ] Test UK OEIC: B4VY989 (should use Morningstar if ID available)

### Cache Behavior
- [ ] First visit: Holdings fetch (check console for API calls)
- [ ] Reload page: Instant load (cached data)
- [ ] Check database: `sqlite3 data/portfolio.db "SELECT fund_symbol, COUNT(*) FROM fund_holdings GROUP BY fund_symbol;"`

### Error Handling
- [ ] Remove API key from .env.local temporarily
- [ ] Verify page still loads (just no holdings data)
- [ ] Verify "Holdings data not available" message appears

### Database Verification

```bash
# Check holdings were cached
sqlite3 data/portfolio.db "SELECT fund_symbol, COUNT(*) as holdings_count, MAX(as_of_date) as latest FROM fund_holdings GROUP BY fund_symbol;"

# View top holdings for IWRD
sqlite3 data/portfolio.db "SELECT holding_name, weight_percent FROM fund_holdings WHERE fund_symbol='IWRD' ORDER BY weight_percent DESC LIMIT 10;"

# Check cache freshness
sqlite3 data/portfolio.db "SELECT fund_symbol, as_of_date, fetched_at FROM fund_holdings GROUP BY fund_symbol ORDER BY fund_symbol;"
```

## Expected Results

### IWRD (iShares MSCI World ETF)
- ~2700 holdings (global stocks)
- Top holding: Usually Apple, Microsoft, or similar
- Mix of US, European, and Asian companies

### IJPH (iShares MSCI Japan ETF)
- ~300 holdings (Japanese stocks)
- Top holdings: Toyota, Sony, Keyence, etc.

### SMT (Scottish Mortgage Investment Trust)
- ~80 holdings (growth companies)
- Top holdings: Tesla, ASML, Amazon, etc.

### UK OEICs (Various)
- 50-200 holdings each
- Depends on fund strategy and provider

## Troubleshooting

### No holdings data showing
1. Check API key is set in `.env.local`
2. Restart dev server after adding API key
3. Check browser console for errors
4. Check terminal logs for API errors

### API rate limit errors
- Free tier: 30 calls/sec, 60 calls/min
- Should not happen with current implementation (500ms delays)
- Wait a minute and try again

### Database errors
- Check `data/` directory exists
- Check SQLite can write to database
- Try: `sqlite3 data/portfolio.db ".tables"` to verify database health

### Missing fund data
- Some funds may not have holdings data available
- This is expected behavior, not an error
- Page will show "Holdings data not available"

## API Usage & Costs

### Finnhub Free Tier
- 60 API calls/minute
- 30 API calls/second
- Sufficient for personal use
- Holdings data updates daily

### Current Usage Pattern
- Initial fetch: 1 call per fund = 9 calls total
- Subsequent fetches: 0 calls (cached for 7 days)
- Monthly usage: ~40 calls (assuming weekly checks)

**Cost**: $0/month (well within free tier)

## Next Steps (Future Enhancements)

Potential improvements for later:

1. **Overlap Analysis**: Show which stocks appear in multiple funds
2. **Sector Breakdown**: Aggregate sector exposure across portfolio
3. **Geographic Exposure**: Map holdings by country
4. **Historical Tracking**: Store holdings snapshots over time
5. **Batch Refresh**: Background job to update all holdings weekly
6. **Export**: Download holdings to CSV
7. **Search/Filter**: Find specific stocks across all funds

## Architecture Notes

### Why This Approach?

1. **Lazy Loading**: Only fetches when viewing fund detail page
   - Reduces initial load time
   - User only sees what they need

2. **7-Day Cache**: Balance between freshness and API usage
   - Holdings don't change frequently
   - Reduces API calls by ~99%

3. **Dual Data Sources**: Maximizes coverage
   - Finnhub: Great for ETFs and some trusts
   - Morningstar: Fallback for UK OEICs

4. **Non-Blocking**: Holdings fetch doesn't block page load
   - Fund details load immediately
   - Holdings appear when ready

## Support

If you encounter issues:
1. Check this guide first
2. Review browser console for errors
3. Check terminal logs for API errors
4. Verify database structure with SQLite

## Branch Info

All changes are committed to the `feature/fund-holdings` branch.

To merge to main:
```bash
git checkout main
git merge feature/fund-holdings
```

Or create a pull request for review.
