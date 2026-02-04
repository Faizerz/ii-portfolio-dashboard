# ii Portfolio Dashboard

A portfolio tracking dashboard for Interactive Investor (ii.co.uk) accounts. Import your holdings from ii.co.uk CSV exports and visualize your portfolio performance over time.

## Features

- **CSV Import**: Import holdings directly from ii.co.uk portfolio exports
- **Historical Price Data**: Fetches up to 15 years of historical prices from Yahoo Finance (ETFs) and Morningstar (UK OEICs/funds)
- **Portfolio Value Chart**: Track your total portfolio value over time with dynamic Y-axis scaling
- **Fund Performance Chart**: Compare individual fund performance with percentage gain/loss
  - Click legend items to show/hide individual funds
  - Tooltip sorted by highest performers
- **Interactive Date Filtering**: 1M, 3M, 6M, 1Y, 3Y, 5Y, YTD, FY, All, or custom date range
- **Holdings Table**: View all holdings sorted by gain/loss percentage
- **Price Caching**: SQLite database caches prices for fast subsequent loads
- **Dark Mode Support**: Automatic dark mode based on system preferences

## Screenshots

### Portfolio Overview
![Portfolio Overview](docs/screenshots/portfolio-overview.png)

### Fund Performance Comparison
![Fund Performance](docs/screenshots/fund-performance.png)

### Holdings Table
![Holdings Table](docs/screenshots/holdings-table.png)

### Import Page
![Import Page](docs/screenshots/import-page.png)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Database**: SQLite (better-sqlite3)
- **Data Sources**: Yahoo Finance API, Morningstar UK API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ii-portfolio-dashboard.git
cd ii-portfolio-dashboard

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Importing Your Portfolio

1. Log in to your Interactive Investor account
2. Go to your Portfolio page
3. Click the download/export button and select CSV format
4. In the dashboard, go to the Import page
5. Upload your CSV file

## Data Sources

- **ETFs** (e.g., IWRD, SMT, IJPH): Prices fetched from Yahoo Finance
- **UK OEICs/Unit Trusts**: Prices fetched from Morningstar UK API

Historical data is cached locally in SQLite to minimize API calls. On first load, fetching 15 years of history for all funds may take a minute.

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── portfolio-history/  # Portfolio value over time
│   │   ├── funds/[symbol]/     # Fund details & holdings
│   │   ├── import/             # CSV import endpoint
│   │   └── clear-data/         # Database reset
│   ├── funds/[symbol]/         # Individual fund detail pages
│   ├── import/                 # CSV import page
│   └── page.tsx                # Main portfolio dashboard
├── components/
│   ├── charts/                 # Recharts components
│   │   ├── portfolio-allocation-chart.tsx
│   │   ├── portfolio-chart.tsx
│   │   ├── fund-price-chart.tsx
│   │   ├── fund-value-chart.tsx
│   │   ├── holdings-pie-chart.tsx
│   │   └── funds-breakdown-chart.tsx
│   ├── tables/                 # TanStack table components
│   │   ├── holdings-table.tsx
│   │   └── holdings-composition-table.tsx
│   └── ui/                     # Reusable UI components
│       ├── card.tsx, button.tsx, loading.tsx
│       ├── date-range-filter.tsx
│       └── summary-card.tsx
├── lib/
│   ├── providers/              # Universal fund holdings fetcher system
│   │   ├── orchestrator.ts     # Waterfall fetching coordinator
│   │   ├── yahoo-fetcher.ts    # Yahoo Finance (ETFs)
│   │   ├── morningstar-fetcher.ts  # Morningstar UK (OEICs)
│   │   ├── ft-scraper.ts       # Financial Times scraper
│   │   └── ...                 # Other provider implementations
│   ├── utils/                  # 🆕 Shared utilities (formatters, calculations, etc.)
│   │   ├── formatters.ts       # Currency, percent, date formatting
│   │   ├── charts/             # Chart utilities (colors, tooltips, labels)
│   │   ├── tables/             # Table utilities (sorting)
│   │   └── calculations/       # Business logic (portfolio, dates, holdings)
│   ├── csv-parser.ts           # ii.co.uk CSV parsing
│   ├── db.ts                   # SQLite database operations
│   ├── price-fetcher.ts        # Yahoo Finance historical prices
│   ├── holdings-fetcher.ts     # Legacy holdings fetcher
│   └── morningstar-fetcher.ts  # Legacy Morningstar integration
└── types/                      # 🆕 Centralized TypeScript type definitions
    ├── index.ts                # Barrel export for all types
    ├── common.ts               # Shared types (DataQuality, FetchStatus, etc.)
    ├── holdings.ts             # Portfolio types (Holding, PortfolioSummary)
    ├── funds.ts                # Fund types (FundDetail, FundHolding)
    ├── api.ts                  # API request/response types
    ├── database.ts             # Database row types
    ├── charts.ts               # Chart component types
    └── providers.ts            # Provider system types
```

### Key Architectural Features

- **🎯 Single Source of Truth**: All types defined once in `src/types/`
- **♻️ DRY Utilities**: Shared utilities eliminate ~900 lines of duplicate code
- **🔌 Universal Provider System**: Automatic fund holdings fetching with waterfall fallback
- **💾 SQLite Caching**: Historical prices cached locally for performance
- **📊 Recharts + TanStack**: Modern charting and table libraries
- **🎨 Consistent Styling**: Shared formatters and chart utilities

For detailed documentation:
- [Type System Documentation](src/types/README.md)
- [Utilities Documentation](src/lib/utils/README.md)

## Data Storage

All data is stored locally in a SQLite database at `data/portfolio.db`. No data is sent to external servers except for fetching prices from Yahoo Finance and Morningstar.

## Troubleshooting

### Prices not showing for some funds

UK OEICs use the Morningstar API which searches by fund name. If a fund isn't found, try ensuring the name in your CSV matches the official fund name.

### Slow initial load

The first load fetches up to 15 years of historical prices for all funds. Subsequent loads use the cached data and only fetch recent updates.

### Database issues

Delete `data/portfolio.db` to start fresh. You'll need to re-import your CSV and prices will be refetched.

## License

MIT
