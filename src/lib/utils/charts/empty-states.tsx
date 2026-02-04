/**
 * Empty state components for charts
 */

/**
 * Props for chart empty state
 */
interface ChartEmptyStateProps {
  message?: string;
  height?: number;
}

/**
 * Standard empty state for charts
 *
 * @param message - Custom message to display
 * @param height - Height in pixels (default 256)
 * @returns JSX element
 */
export function ChartEmptyState({ message, height = 256 }: ChartEmptyStateProps) {
  return (
    <div
      className="flex items-center justify-center text-gray-500"
      style={{ height: `${height}px` }}
    >
      {message || 'No data available'}
    </div>
  );
}

/**
 * Predefined empty state messages
 */
export const EmptyStates = {
  noData: () => <ChartEmptyState message="No data available" />,
  noPortfolioData: () => <ChartEmptyState message="No portfolio data available" />,
  noHoldingsData: () => <ChartEmptyState message="No holdings data available" />,
  noPriceData: () => <ChartEmptyState message="No price data available" />,
  noPerformanceData: () => <ChartEmptyState message="No performance data available" />,
} as const;
