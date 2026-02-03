'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Holding {
  symbol: string;
  name: string;
  marketValue: number;
}

interface PortfolioAllocationChartProps {
  holdings: Holding[];
}

// Color palette for funds
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

export function PortfolioAllocationChart({ holdings }: PortfolioAllocationChartProps) {
  const chartData = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);

    // Create chart data with percentages
    return holdings
      .map((h) => ({
        name: h.symbol,
        fullName: h.name,
        value: h.marketValue,
        percentage: (h.marketValue / totalValue) * 100,
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [holdings]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No portfolio data available
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const truncateName = (name: string, maxLen = 30) => {
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen) + '...';
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      payload: { fullName: string; percentage: number };
    }>;
  }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white">{data.payload.fullName}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Value: <span className="font-semibold">{formatCurrency(data.value)}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Allocation: <span className="font-semibold">{formatPercent(data.payload.percentage)}</span>
        </p>
      </div>
    );
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    // Only show label if slice is large enough (>5%)
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-6 px-4">
        {chartData.map((entry, index) => (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <span
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {entry.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatCurrency(entry.value)} ({formatPercent(entry.percentage)})
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={140}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {renderLegend()}
    </div>
  );
}
