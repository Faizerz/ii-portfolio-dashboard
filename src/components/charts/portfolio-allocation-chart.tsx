'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Holding } from '@/types';
import {
  CHART_COLORS,
  formatCurrency,
  formatPercent,
  truncateName,
  AllocationTooltip,
  renderPieLabel,
  createAllocationLegend,
  ChartEmptyState,
} from '@/lib/utils';

interface PortfolioAllocationChartProps {
  holdings: Holding[];
}

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
    return <ChartEmptyState message="No portfolio data available" />;
  }

  const legendData = chartData.map((entry) => ({
    name: entry.name,
    value: entry.value,
    percentage: entry.percentage,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderPieLabel}
            outerRadius={140}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<AllocationTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {createAllocationLegend(legendData)}
    </div>
  );
}
