/**
 * Chart color utilities for consistent styling
 */

/**
 * Standard color palette for charts
 */
export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
] as const;

/**
 * Get a color from the chart palette by index
 * Wraps around if index exceeds palette length
 *
 * @param index - The index in the color palette
 * @returns A hex color string
 *
 * @example
 * getChartColor(0) // "#3b82f6"
 * getChartColor(15) // Wraps around to "#f59e0b"
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Get a color based on whether a value is positive or negative
 *
 * @param value - The numeric value to evaluate
 * @returns A hex color string (green for positive, red for negative)
 *
 * @example
 * getTrendColor(5.42) // "#10b981" (green)
 * getTrendColor(-2.15) // "#ef4444" (red)
 */
export function getTrendColor(value: number): string {
  return value >= 0 ? '#10b981' : '#ef4444';
}
