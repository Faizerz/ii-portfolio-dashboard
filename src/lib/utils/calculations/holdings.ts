/**
 * Holdings calculation and transformation utilities
 */

import type { FundHolding } from '@/types';

/**
 * Sort holdings by weight percentage (descending)
 *
 * @param holdings - Array of fund holdings
 * @returns Sorted array (does not mutate original)
 */
export function sortHoldingsByWeight(holdings: FundHolding[]): FundHolding[] {
  return [...holdings].sort((a, b) => b.weightPercent - a.weightPercent);
}

/**
 * Get top N holdings with remaining grouped as "Others"
 *
 * @param holdings - Array of fund holdings
 * @param topN - Number of top holdings to show individually (default 10)
 * @returns Array with top N holdings plus "Others" if applicable
 */
export function getTopHoldingsWithOthers(
  holdings: FundHolding[],
  topN: number = 10
): FundHolding[] {
  if (holdings.length <= topN) {
    return sortHoldingsByWeight(holdings);
  }

  const sorted = sortHoldingsByWeight(holdings);
  const topHoldings = sorted.slice(0, topN);
  const others = sorted.slice(topN);

  const othersWeight = others.reduce((sum, h) => sum + h.weightPercent, 0);

  return [
    ...topHoldings,
    {
      name: 'Others',
      weightPercent: othersWeight,
    },
  ];
}
