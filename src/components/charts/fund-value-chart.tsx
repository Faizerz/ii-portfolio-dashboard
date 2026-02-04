'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency, getTrendColor, ChartEmptyState } from '@/lib/utils';

interface ValuePoint {
  date: string;
  value: number;
}

interface FundValueChartProps {
  data: ValuePoint[];
  bookCost: number;
}

export function FundValueChart({ data, bookCost }: FundValueChartProps) {
  if (!data || data.length === 0) {
    return <ChartEmptyState message="No value data available" />;
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM yy');
    } catch {
      return dateStr;
    }
  };

  // Calculate if current value is above book cost
  const currentValue = data[data.length - 1]?.value || 0;
  const gainLoss = currentValue - bookCost;
  const chartColor = getTrendColor(gainLoss);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorFundValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12 }}
          width={60}
          domain={['auto', 'auto']}
        />
        <ReferenceLine
          y={bookCost}
          stroke="#6b7280"
          strokeDasharray="5 5"
          label={{
            value: 'Book Cost',
            position: 'right',
            fill: '#6b7280',
            fontSize: 11,
          }}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), 'Position Value']}
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
        <Area
          type="monotone"
          dataKey="value"
          stroke={chartColor}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorFundValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
