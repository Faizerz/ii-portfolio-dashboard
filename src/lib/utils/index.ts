/**
 * Utility functions barrel export
 *
 * Import utilities using: import { utilityName } from '@/lib/utils'
 */

// Formatters
export {
  formatCurrency,
  formatPercent,
  formatDate,
  truncateName,
  formatNumber,
} from './formatters';

// Chart utilities
export { CHART_COLORS, getChartColor, getTrendColor } from './charts/colors';
export {
  FinancialTooltip,
  AllocationTooltip,
  HoldingsWeightTooltip,
} from './charts/tooltips';
export { renderPieLabel, createPieLabel } from './charts/labels';
export { LegendItem, createAllocationLegend } from './charts/legends';
export { ChartEmptyState, EmptyStates } from './charts/empty-states';

// Table utilities
export { getSortIcon, TABLE_HEADER_CLASSES } from './tables/sorting';

// Calculation utilities
export { calculateGainLoss, calculatePortfolioSummary } from './calculations/portfolio';
export { filterByDateRange, rebasePercentageData } from './calculations/dates';
export { sortHoldingsByWeight, getTopHoldingsWithOthers } from './calculations/holdings';
