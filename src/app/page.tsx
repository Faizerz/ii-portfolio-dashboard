'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SummaryCard } from '@/components/ui/summary-card';
import { PortfolioChart } from '@/components/charts/portfolio-chart';
import { FundsBreakdownChart } from '@/components/charts/funds-breakdown-chart';
import { HoldingsTable } from '@/components/tables/holdings-table';
import { LoadingSpinner } from '@/components/ui/loading';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import Link from 'next/link';

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  bookCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  hasYahooSymbol: boolean;
}

interface PortfolioData {
  holdings: Holding[];
  portfolioHistory: Array<{ date: string; value: number; invested: number }>;
  fundPerformance: Array<{ date: string; [symbol: string]: number | string }>;
  fundNames: string[];
  fundLabels: Record<string, string>;
  summary: {
    totalValue: number;
    totalInvested: number;
    gainLoss: number;
    gainLossPercent: number;
  } | null;
}

export default function HomePage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/portfolio-history');
        if (!response.ok) throw new Error('Failed to fetch portfolio data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter data based on selected date range - must be before any early returns
  const filteredPortfolioHistory = useMemo(() => {
    if (!data?.portfolioHistory || !dateRange.start) return data?.portfolioHistory ?? [];
    return data.portfolioHistory.filter((p) => p.date >= dateRange.start!);
  }, [data?.portfolioHistory, dateRange.start]);

  const filteredFundPerformance = useMemo(() => {
    if (!data?.fundPerformance) return [];

    const filtered = dateRange.start
      ? data.fundPerformance.filter((p) => p.date >= dateRange.start!)
      : data.fundPerformance;

    if (filtered.length === 0) return [];

    // Find the first valid value for each fund to use as its baseline
    const fundBaselines: Record<string, number> = {};
    for (const entry of filtered) {
      for (const key of Object.keys(entry)) {
        if (key === 'date') continue;
        if (fundBaselines[key] === undefined && typeof entry[key] === 'number') {
          fundBaselines[key] = entry[key] as number;
        }
      }
    }

    // Recalculate percentages relative to each fund's first value in the range
    return filtered.map((entry) => {
      const rebasedEntry: { date: string; [symbol: string]: number | string } = { date: entry.date };

      for (const key of Object.keys(entry)) {
        if (key === 'date') continue;

        const currentValue = entry[key] as number;
        const baselineValue = fundBaselines[key];

        if (typeof currentValue === 'number' && typeof baselineValue === 'number') {
          // Convert from absolute % to rebased %
          // If baseline was +20% and current is +30%, the change from baseline is:
          // ((1 + 0.30) / (1 + 0.20) - 1) * 100 = 8.33%
          const baselineMultiplier = 1 + baselineValue / 100;
          const currentMultiplier = 1 + currentValue / 100;
          const rebasedPercent = (currentMultiplier / baselineMultiplier - 1) * 100;
          rebasedEntry[key] = rebasedPercent;
        }
      }

      return rebasedEntry;
    });
  }, [data?.fundPerformance, dateRange.start]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LoadingSpinner />
        <p className="text-gray-500 dark:text-gray-400">Loading portfolio data...</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Fetching historical prices (this may take a moment)</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data || data.holdings.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Portfolio Tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Get started by importing your holdings statement from ii.co.uk
        </p>
        <Link
          href="/import"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Import Statement
        </Link>
      </div>
    );
  }

  const { holdings, fundNames, fundLabels, summary } = data;

  const handleDateRangeChange = (start: string | null, end: string | null) => {
    setDateRange({ start, end });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Overview</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Historical performance based on current holdings
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Portfolio Value"
            value={formatCurrency(summary.totalValue)}
            trend={summary.gainLoss >= 0 ? 'up' : 'down'}
          />
          <SummaryCard
            title="Total Invested"
            value={formatCurrency(summary.totalInvested)}
          />
          <SummaryCard
            title="Total Gain/Loss"
            value={formatCurrency(summary.gainLoss)}
            trend={summary.gainLoss >= 0 ? 'up' : 'down'}
            trendValue={formatPercent(summary.gainLossPercent)}
          />
          <SummaryCard
            title="Holdings"
            value={holdings.length.toString()}
            subtitle="funds"
          />
        </div>
      )}

      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Time period:</span>
        <DateRangeFilter onRangeChange={handleDateRangeChange} />
      </div>

      {/* Portfolio Value Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioChart data={filteredPortfolioHistory} />
        </CardContent>
      </Card>

      {/* Fund Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Fund Performance (% Gain/Loss)</CardTitle>
        </CardHeader>
        <CardContent>
          <FundsBreakdownChart
            data={filteredFundPerformance}
            funds={fundNames}
            fundLabels={fundLabels}
          />
        </CardContent>
      </Card>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <HoldingsTable data={holdings} />
        </CardContent>
      </Card>
    </div>
  );
}
