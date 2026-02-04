'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { FundHolding } from '@/types';
import {
  CHART_COLORS,
  formatPercent,
  truncateName,
  HoldingsWeightTooltip,
  renderPieLabel,
  EmptyStates,
} from '@/lib/utils';

interface HoldingsPieChartProps {
  holdings: FundHolding[];
  showTopN?: number;
}

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
    return <EmptyStates.noHoldingsData />;
  }

  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-6 px-4">
        {chartData.map((entry, index) => (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
          >
            <span
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="text-sm font-medium text-gray-700">
              {truncateName(entry.name, 25)}
            </span>
            <span className="text-sm text-gray-500">
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
            label={renderPieLabel}
            outerRadius={140}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<HoldingsWeightTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {renderLegend()}
    </div>
  );
}
