'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SummaryCard } from '@/components/ui/summary-card';
import { PortfolioChart } from '@/components/charts/portfolio-chart';
import { PortfolioAllocationChart } from '@/components/charts/portfolio-allocation-chart';
import { FundsBreakdownChart } from '@/components/charts/funds-breakdown-chart';
import { HoldingsTable } from '@/components/tables/holdings-table';
import { LoadingSpinner } from '@/components/ui/loading';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import Link from 'next/link';
import type { PortfolioResponse } from '@/types';
import { formatCurrency, formatPercent, rebasePercentageData, filterByDateRange } from '@/lib/utils';

export default function HomePage() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
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
    if (!data?.portfolioHistory) return [];
    return filterByDateRange(data.portfolioHistory, dateRange.start);
  }, [data?.portfolioHistory, dateRange.start]);

  const filteredFundPerformance = useMemo(() => {
    if (!data?.fundPerformance) return [];

    const filtered = filterByDateRange(data.fundPerformance, dateRange.start);
    if (filtered.length === 0) return [];

    // Rebase percentages to the first value in the range
    return rebasePercentageData(filtered);
  }, [data?.fundPerformance, dateRange.start]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LoadingSpinner />
        <p className="text-gray-500">Loading portfolio data...</p>
        <p className="text-sm text-gray-400">Fetching historical prices (this may take a moment)</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data || data.holdings.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Portfolio Tracker
        </h1>
        <p className="text-gray-600 mb-6">
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
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Overview</h1>
        <p className="text-gray-600 mt-1">
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

      {/* Portfolio Allocation Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation by Fund</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioAllocationChart holdings={holdings} />
        </CardContent>
      </Card>

      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Time period:</span>
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
