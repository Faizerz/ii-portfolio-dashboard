/**
 * Chart legend utilities for consistent rendering
 */

import { formatCurrency, formatPercent } from '../formatters';
import { getChartColor } from './colors';

/**
 * Props for a legend item
 */
interface LegendItemData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

/**
 * Render a single legend item
 *
 * @param item - Legend item data
 * @param index - Item index (used for color if not specified)
 * @returns JSX element
 */
export function LegendItem({ item, index }: { item: LegendItemData; index: number }) {
  const color = item.color || getChartColor(index);

  return (
    <div
      key={`legend-${index}`}
      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
    >
      <span
        className="w-4 h-4 rounded-sm flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">{item.name}</span>
        <span className="text-xs text-gray-500">
          {formatCurrency(item.value)}
          {item.percentage !== undefined && (
            <> ({formatPercent(item.percentage, { decimals: 1, showSign: false })})</>
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * Create a complete allocation legend component
 *
 * @param data - Array of legend items
 * @returns JSX element
 */
export function createAllocationLegend(data: LegendItemData[]) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6 px-4">
      {data.map((item, index) => (
        <LegendItem key={index} item={item} index={index} />
      ))}
    </div>
  );
}
