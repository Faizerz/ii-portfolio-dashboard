/**
 * Date filtering and data transformation utilities
 */

/**
 * Filter an array of dated items by date range
 *
 * @param data - Array of objects with a date property
 * @param startDate - Start date (inclusive) or null for no filter
 * @param endDate - End date (inclusive) or null for no filter
 * @returns Filtered array
 */
export function filterByDateRange<T extends { date: string }>(
  data: T[],
  startDate: string | null,
  endDate: string | null = null
): T[] {
  if (!startDate && !endDate) return data;

  return data.filter((item) => {
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    return true;
  });
}

/**
 * Rebase percentage data relative to the first value in each series
 *
 * This is useful for performance charts where you want to show relative
 * performance from a specific starting point, rather than absolute returns.
 *
 * For example, if Fund A was +20% and is now +30%, and the date range starts
 * at the +20% point, this will rebase it to show 0% initially and ~8.33% at the end.
 *
 * @param data - Array of data points with date and numeric values
 * @param excludeKeys - Keys to exclude from rebasing (default: ['date'])
 * @returns Rebased data array
 *
 * @example
 * const data = [
 *   { date: '2024-01-01', fundA: 20, fundB: 15 },
 *   { date: '2024-02-01', fundA: 30, fundB: 18 },
 * ];
 * const rebased = rebasePercentageData(data);
 * // Result:
 * // [
 * //   { date: '2024-01-01', fundA: 0, fundB: 0 },
 * //   { date: '2024-02-01', fundA: 8.33, fundB: 2.61 },
 * // ]
 */
export function rebasePercentageData<T extends Record<string, any>>(
  data: Array<T & { date: string }>,
  excludeKeys: string[] = ['date']
): Array<T & { date: string }> {
  if (data.length === 0) return [];

  // Find the first valid value for each key to use as its baseline
  const baselines: Record<string, number> = {};
  for (const entry of data) {
    for (const key of Object.keys(entry)) {
      if (excludeKeys.includes(key)) continue;
      if (baselines[key] === undefined && typeof entry[key] === 'number') {
        baselines[key] = entry[key] as number;
      }
    }
  }

  // Recalculate percentages relative to each key's first value in the range
  return data.map((entry) => {
    const rebasedEntry: any = { ...entry };

    for (const key of Object.keys(entry)) {
      if (excludeKeys.includes(key)) continue;

      const currentValue = entry[key];
      const baselineValue = baselines[key];

      if (typeof currentValue === 'number' && typeof baselineValue === 'number') {
        // Convert from absolute % to rebased %
        // If baseline was +20% and current is +30%, the change from baseline is:
        // ((1 + 0.30) / (1 + 0.20) - 1) * 100 = 8.33%
        const baselineMultiplier = 1 + baselineValue / 100;
        const currentMultiplier = 1 + currentValue / 100;
        const rebasedPercent = (currentMultiplier / baselineMultiplier - 1) * 100;
        rebasedEntry[key] = rebasedPercent;
      }
    }

    return rebasedEntry as T & { date: string };
  });
}
