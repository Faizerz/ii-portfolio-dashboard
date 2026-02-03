'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { FundHolding } from '@/types';

interface HoldingsPieChartProps {
  holdings: FundHolding[];
  showTopN?: number;
}

// Color palette for holdings
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
  '#94a3b8', // slate (for Others)
];

export function HoldingsPieChart({ holdings, showTopN = 10 }: HoldingsPieChartProps) {
  const chartData = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    // Sort by weight descending
    const sortedHoldings = [...holdings].sort((a, b) => b.weightPercent - a.weightPercent);

    // Take top N
    const topHoldings = sortedHoldings.slice(0, showTopN);
    const remainingHoldings = sortedHoldings.slice(showTopN);

    // Create chart data
    const data = topHoldings.map((h) => ({
      name: h.symbol || h.name,
      fullName: h.name,
      value: h.weightPercent,
    }));

    // Add "Others" if there are remaining holdings
    if (remainingHoldings.length > 0) {
      const othersPercent = remainingHoldings.reduce((sum, h) => sum + h.weightPercent, 0);
      data.push({
        name: 'Others',
        fullName: `${remainingHoldings.length} other holdings`,
        value: othersPercent,
      });
    }

    return data;
  }, [holdings, showTopN]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No holdings data available
      </div>
    );
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const truncateName = (name: string, maxLen = 20) => {
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen) + '...';
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: { fullName: string } }>;
  }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-gray-900 dark:text-white">{data.payload.fullName}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Weight: <span className="font-semibold">{formatPercent(data.value)}</span>
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
    // Only show label if slice is large enough (>3%)
    if (percent < 0.03) return null;

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
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-6 px-4">
        {chartData.map((entry, index) => (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <span
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {truncateName(entry.name, 25)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatPercent(entry.value)}
            </span>
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
