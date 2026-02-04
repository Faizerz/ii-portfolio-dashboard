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

### 1. Understanding Data Sources

**Important**: Finnhub's free tier only covers **US market ETFs**. Since this is a UK portfolio tracker, most funds will use Morningstar as the primary data source.

**Data source priority:**
- **UK funds** (.L suffix or long symbols): Morningstar (primary) → Finnhub (fallback)
- **US funds** (short symbols): Finnhub (primary) → Morningstar (fallback)

### 2. Get Finnhub API Key (Optional for US ETFs)

Only needed if you plan to add US-listed ETFs to your portfolio:
- Visit: https://finnhub.io/register
- Sign up for a free account
- Copy your API key from the dashboard
- Free tier limits: 30 calls/sec, 60 calls/min
- **Free tier coverage**: US market only

### 3. Configure Environment

Edit `.env.local` (already created) and add your API key:

```bash
FINNHUB_API_KEY=your_actual_api_key_here
```

**Important**: The app will work without this key for UK funds. Morningstar will be used automatically for funds with Morningstar IDs (which are auto-detected from ISINs).

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

1. **UK/International Funds** (IWRD.L, IJPH.L, SMT.L, UK OEICs): Morningstar API (primary)
   - Covers UK-listed ETFs and OEICs
   - Automatically uses funds' Morningstar IDs
   - Typically 50-2700+ holdings depending on fund
   - Updates available regularly

2. **US ETFs** (if added to portfolio): Finnhub API
   - Only covers US market (not London-listed)
   - Free tier limitation: US stocks only
   - Usually has 100-3000+ holdings
   - Updates available daily

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
- [ ] Test ETF: IWRD (should use Morningstar via ISIN)
- [ ] Test Investment Trust: SMT (should use Morningstar)
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

### IWRD.L (iShares MSCI World ETF - London-listed)
- ~2700 holdings (global stocks)
- Top holding: Usually Apple, Microsoft, or similar
- Mix of US, European, and Asian companies
- **Data source**: Morningstar (via ISIN auto-detection)

### IJPH.L (iShares MSCI Japan ETF - London-listed)
- ~300 holdings (Japanese stocks)
- Top holdings: Toyota, Sony, Keyence, etc.
- **Data source**: Morningstar

### SMT (Scottish Mortgage Investment Trust)
- ~80 holdings (growth companies)
- Top holdings: Tesla, ASML, Amazon, etc.
- **Data source**: Morningstar

### UK OEICs (Various)
- 50-200 holdings each
- Depends on fund strategy and provider
- **Data source**: Morningstar

## Troubleshooting

### No holdings data showing
1. Check if fund has Morningstar ID (check browser console logs)
2. Verify fund's ISIN is present in database (Morningstar auto-detects from ISIN)
3. Check browser console for errors
4. Check terminal logs for API errors
5. If using US ETFs: Check Finnhub API key is set in `.env.local`

### API rate limit errors
- Morningstar: No documented rate limits (public API)
- Finnhub free tier: 30 calls/sec, 60 calls/min
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

### Morningstar API (Primary)
- **Cost**: Free (public API)
- No authentication required
- No documented rate limits
- Covers UK/EU funds and ETFs
- Holdings data updates regularly

### Finnhub Free Tier (Optional - US ETFs only)
- **Cost**: Free tier available
- 60 API calls/minute
- 30 API calls/second
- **Limitation**: US market data only
- Only needed if you add US ETFs to portfolio

### Current Usage Pattern
- Initial fetch: 1 call per fund = 9 calls total (to Morningstar)
- Subsequent fetches: 0 calls (cached for 7 days)
- Monthly usage: ~40 calls (assuming weekly checks)

**Total Cost**: $0/month

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
