/**
 * Reusable tooltip components for charts
 */

import { formatCurrency, formatPercent } from '../formatters';

/**
 * Tooltip props for financial data
 */
interface FinancialTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    dataKey?: string;
    color?: string;
  }>;
  label?: string;
}

/**
 * Standard tooltip for financial time-series data
 *
 * Displays formatted currency values with labels
 */
export function FinancialTooltip({ active, payload, label }: FinancialTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
      {label && <p className="font-medium text-gray-900 mb-2">{label}</p>}
      {payload.map((entry, index) => (
        <p key={index} className="text-sm text-gray-600">
          {entry.name}:{' '}
          <span className="font-semibold" style={{ color: entry.color }}>
            {formatCurrency(entry.value || 0)}
          </span>
        </p>
      ))}
    </div>
  );
}

/**
 * Tooltip props for allocation/pie charts
 */
interface AllocationTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { fullName?: string; percentage?: number };
  }>;
}

/**
 * Tooltip for portfolio allocation pie charts
 *
 * Shows full name, value, and percentage allocation
 */
export function AllocationTooltip({ active, payload }: AllocationTooltipProps) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
      <p className="font-medium text-gray-900">
        {data.payload.fullName || data.name}
      </p>
      <p className="text-sm text-gray-600">
        Value: <span className="font-semibold">{formatCurrency(data.value)}</span>
      </p>
      {data.payload.percentage !== undefined && (
        <p className="text-sm text-gray-600">
          Allocation:{' '}
          <span className="font-semibold">{formatPercent(data.payload.percentage, { decimals: 1, showSign: false })}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Tooltip props for holdings weight charts
 */
interface HoldingsWeightTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { fullName?: string };
  }>;
}

/**
 * Tooltip for fund holdings weight pie charts
 *
 * Shows holding name and weight percentage
 */
export function HoldingsWeightTooltip({ active, payload }: HoldingsWeightTooltipProps) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
      <p className="font-medium text-gray-900">
        {data.payload.fullName || data.name}
      </p>
      <p className="text-sm text-gray-600">
        Weight: <span className="font-semibold">{formatPercent(data.value, { decimals: 2, showSign: false })}</span>
      </p>
    </div>
  );
}
