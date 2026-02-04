'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { CHART_COLORS, formatPercent, getChartColor, EmptyStates } from '@/lib/utils';

interface FundBreakdownPoint {
  date: string;
  [symbol: string]: string | number;
}

interface FundsBreakdownChartProps {
  data: FundBreakdownPoint[];
  funds: string[];
  fundLabels?: Record<string, string>;
}

export function FundsBreakdownChart({ data, funds, fundLabels = {} }: FundsBreakdownChartProps) {
  const [hiddenFunds, setHiddenFunds] = useState<Set<string>>(new Set());

  if (!data || data.length === 0 || funds.length === 0) {
    return <EmptyStates.noPerformanceData />;
  }

  const toggleFund = (fund: string) => {
    setHiddenFunds((prev) => {
      const next = new Set(prev);
      if (next.has(fund)) {
        next.delete(fund);
      } else {
        next.add(fund);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM yy');
    } catch {
      return dateStr;
    }
  };

  // Get display name for a fund
  const getDisplayName = (symbol: string) => {
    return fundLabels[symbol] || symbol;
  };

  // Truncate fund names for legend
  const truncateName = (name: string, maxLen = 25) => {
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen) + '...';
  };

  // Custom tooltip that sorts by value
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
    if (!active || !payload) return null;

    // Sort by value descending
    const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

    let formattedDate = label;
    try {
      formattedDate = format(parseISO(String(label)), 'dd MMM yyyy');
    } catch {
      // keep original
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{formattedDate}</p>
        {sortedPayload.map((entry) => (
          <div key={entry.dataKey} className="flex justify-between gap-4 text-sm py-0.5">
            <span style={{ color: entry.color }}>{truncateName(getDisplayName(entry.dataKey), 30)}</span>
            <span className={`font-medium ${entry.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Custom legend component for better usability
  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-6 px-4">
        {funds.map((fund, index) => {
          const isHidden = hiddenFunds.has(fund);
          return (
            <button
              key={fund}
              onClick={() => toggleFund(fund)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isHidden
                  ? 'bg-gray-100 opacity-50'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <span
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: isHidden ? '#9ca3af' : CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className={`text-sm font-medium ${
                isHidden
                  ? 'text-gray-400 line-through'
                  : 'text-gray-700'
              }`}>
                {truncateName(getDisplayName(fund), 35)}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={550}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
            tick={{ fontSize: 12 }}
            width={50}
          />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />
          {funds.map((fund, index) => (
            <Line
              key={fund}
              type="monotone"
              dataKey={fund}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
              hide={hiddenFunds.has(fund)}
              strokeOpacity={hiddenFunds.has(fund) ? 0 : 1}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {renderLegend()}
    </div>
  );
}
