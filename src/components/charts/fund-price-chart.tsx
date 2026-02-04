'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { PricePoint } from '@/types';
import { formatCurrency, getTrendColor, EmptyStates } from '@/lib/utils';

interface FundPriceChartProps {
  data: PricePoint[];
}

export function FundPriceChart({ data }: FundPriceChartProps) {
  if (!data || data.length === 0) {
    return <EmptyStates.noPriceData />;
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM yy');
    } catch {
      return dateStr;
    }
  };

  // Calculate if overall trend is positive
  const firstPrice = data[0]?.price || 0;
  const lastPrice = data[data.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const chartColor = getTrendColor(priceChange);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(value) => `£${value.toFixed(2)}`}
          tick={{ fontSize: 12 }}
          width={70}
          domain={['auto', 'auto']}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'Price']}
          labelFormatter={(label) => {
            try {
              return format(parseISO(String(label)), 'dd MMM yyyy');
            } catch {
              return String(label);
            }
          }}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke={chartColor}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
