'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { PortfolioHistoryPoint } from '@/types';
import { formatCurrency, getTrendColor, ChartEmptyState } from '@/lib/utils';

interface PortfolioChartProps {
  data: PortfolioHistoryPoint[];
}

export function PortfolioChart({ data }: PortfolioChartProps) {
  if (!data || data.length === 0) {
    return <ChartEmptyState message="No portfolio data available" />;
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM yy');
    } catch {
      return dateStr;
    }
  };

  // Calculate gain/loss for coloring
  const latestValue = data[data.length - 1]?.value || 0;
  const latestInvested = data[data.length - 1]?.invested || 0;
  const gainLoss = latestValue - latestInvested;
  const chartColor = getTrendColor(gainLoss);

  // Calculate Y-axis domain with padding to better show value changes
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = range * 0.1; // 10% padding
  const yMin = Math.max(0, minValue - padding);
  const yMax = maxValue + padding;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
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
          domain={[yMin, yMax]}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), 'Portfolio Value']}
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
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
