'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SummaryCard } from '@/components/ui/summary-card';
import { LoadingSpinner } from '@/components/ui/loading';
import { FundPriceChart } from '@/components/charts/fund-price-chart';
import { FundValueChart } from '@/components/charts/fund-value-chart';

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
}

export default function FundPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [fund, setFund] = useState<FundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setFund(data);
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
          <p className="text-gray-600 dark:text-gray-400 mt-1">{fund.symbol}</p>
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
        />
      </div>

      {/* Performance indicator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {isPositive ? (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Performance</p>
              <p className={`text-lg font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercent(fund.gainLossPercent)} ({formatCurrency(fund.gainLoss)})
              </p>
            </div>
            {fund.currentPrice > 0 && (
              <div className="ml-auto text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(fund.currentPrice)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price History Chart */}
      {fund.priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <FundPriceChart data={fund.priceHistory} />
          </CardContent>
        </Card>
      )}

      {/* Value History Chart */}
      {fund.valueHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Position Value Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <FundValueChart data={fund.valueHistory} bookCost={fund.bookCost} />
          </CardContent>
        </Card>
      )}

      {/* No price data message */}
      {fund.priceHistory.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Historical price data is not available for this fund.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
