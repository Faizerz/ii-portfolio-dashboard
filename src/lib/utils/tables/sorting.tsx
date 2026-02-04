/**
 * Table sorting utilities
 */

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { SortingState } from '@tanstack/react-table';

/**
 * Get the appropriate sort icon for a table column
 *
 * @param columnId - The column identifier
 * @param sorting - Current sorting state
 * @returns JSX element with appropriate arrow icon
 */
export function getSortIcon(columnId: string, sorting: SortingState) {
  const sortedColumn = sorting.find((s) => s.id === columnId);
  if (!sortedColumn) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
  return sortedColumn.desc ? (
    <ArrowDown className="w-4 h-4 ml-1" />
  ) : (
    <ArrowUp className="w-4 h-4 ml-1" />
  );
}

/**
 * Standard table header classes
 */
export const TABLE_HEADER_CLASSES =
  'px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-50';
