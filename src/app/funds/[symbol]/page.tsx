'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SummaryCard } from '@/components/ui/summary-card';
import { LoadingSpinner } from '@/components/ui/loading';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { FundValueChart } from '@/components/charts/fund-value-chart';
import { HoldingsPieChart } from '@/components/charts/holdings-pie-chart';
import { HoldingsCompositionTable } from '@/components/tables/holdings-composition-table';
import type { FundHoldingsData } from '@/types';

interface FundData {
  symbol: string;
  sedol?: string;
  name: string;
  quantity: number;
  bookCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  hasYahooSymbol: boolean;
  priceHistory: Array<{ date: string; price: number }>;
  valueHistory: Array<{ date: string; value: number }>;
  holdingsData?: FundHoldingsData | null;
}

export default function FundPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [fund, setFund] = useState<FundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    async function fetchFund() {
      try {
        setLoading(true);
        const response = await fetch(`/api/funds/${encodeURIComponent(symbol)}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Fund not found');
          }
          throw new Error('Failed to fetch fund data');
        }
        const data = await response.json();

        // Fetch holdings data separately (non-blocking)
        let holdingsData = null;
        try {
          const holdingsResponse = await fetch(`/api/funds/${encodeURIComponent(symbol)}/holdings`);
          if (holdingsResponse.ok) {
            holdingsData = await holdingsResponse.json();
            // Only include if we have actual holdings
            if (holdingsData?.holdings?.length === 0) {
              holdingsData = null;
            }
          }
        } catch (holdingsErr) {
          console.warn('Failed to fetch holdings data:', holdingsErr);
          // Don't fail the whole page if holdings fetch fails
        }

        setFund({ ...data, holdingsData });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (symbol) {
      fetchFund();
    }
  }, [symbol]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Filter value history based on date range
  const filteredValueHistory = useMemo(() => {
    if (!fund?.valueHistory || !dateRange.start) return fund?.valueHistory ?? [];
    return fund.valueHistory.filter((v) => v.date >= dateRange.start!);
  }, [fund?.valueHistory, dateRange.start]);

  const handleDateRangeChange = (start: string | null, end: string | null) => {
    setDateRange({ start, end });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LoadingSpinner />
        <p className="text-gray-500 dark:text-gray-400">Loading fund data...</p>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error || 'Fund not found'}</p>
        </div>
      </div>
    );
  }

  const isPositive = fund.gainLoss >= 0;
  const avgCostPerUnit = fund.bookCost / fund.quantity;

  return (
    <div className="space-y-8">
      {/* Back link and header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{fund.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600 dark:text-gray-400">{fund.symbol}</p>
            {fund.sedol && (
              <p className="text-sm text-gray-500 dark:text-gray-500">SEDOL: {fund.sedol}</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Current Value"
          value={formatCurrency(fund.marketValue)}
          trend={isPositive ? 'up' : 'down'}
        />
        <SummaryCard
          title="Book Cost"
          value={formatCurrency(fund.bookCost)}
          subtitle={`Avg: ${formatCurrency(avgCostPerUnit)}/unit`}
        />
        <SummaryCard
          title="Gain/Loss"
          value={formatCurrency(fund.gainLoss)}
          trend={isPositive ? 'up' : 'down'}
          trendValue={formatPercent(fund.gainLossPercent)}
        />
        <SummaryCard
          title="Units Held"
          value={fund.quantity.toLocaleString('en-GB', { maximumFractionDigits: 4 })}
          subtitle={fund.currentPrice > 0 ? `@ ${formatCurrency(fund.currentPrice)}` : ''}
        />
      </div>

      {/* Holdings Composition - Pie Chart */}
      {fund.holdingsData && fund.holdingsData.holdings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Composition</CardTitle>
            {fund.holdingsData.asOfDate && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                As of {new Date(fund.holdingsData.asOfDate).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <HoldingsPieChart holdings={fund.holdingsData.holdings} showTopN={10} />
          </CardContent>
        </Card>
      )}

      {/* Top Holdings Table */}
      {fund.holdingsData && fund.holdingsData.holdings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Holdings Breakdown ({fund.holdingsData.numberOfHoldings} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HoldingsCompositionTable data={fund.holdingsData.holdings} />
          </CardContent>
        </Card>
      )}

      {/* Value History Chart */}
      {fund.valueHistory.length > 0 && (
        <>
          {/* Date Range Filter */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Time period:</span>
            <DateRangeFilter onRangeChange={handleDateRangeChange} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Position Value Over Time</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your investment value based on {fund.quantity.toLocaleString('en-GB', { maximumFractionDigits: 4 })} units
              </p>
            </CardHeader>
            <CardContent>
              <FundValueChart data={filteredValueHistory} bookCost={fund.bookCost} />
            </CardContent>
          </Card>
        </>
      )}

      {/* No price data message */}
      {fund.priceHistory.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
              <Info className="w-5 h-5" />
              <p>Historical price data is not available for this fund.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
