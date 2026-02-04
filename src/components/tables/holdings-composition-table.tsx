'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import type { FundHolding } from '@/types';
import { formatPercent, formatNumber, getSortIcon } from '@/lib/utils';

interface HoldingsCompositionTableProps {
  data: FundHolding[];
  showAll?: boolean;
}

const columnHelper = createColumnHelper<FundHolding>();

export function HoldingsCompositionTable({ data, showAll = false }: HoldingsCompositionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'weightPercent', desc: true }]);
  const [expanded, setExpanded] = useState(showAll);

  const displayData = expanded ? data : data.slice(0, 10);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Holding',
        cell: (info) => (
          <div>
            <div className="font-medium text-gray-900">
              {info.getValue()}
            </div>
            {info.row.original.symbol && (
              <div className="text-xs text-gray-500">
                {info.row.original.symbol}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('assetType', {
        header: 'Type',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('weightPercent', {
        header: 'Weight',
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-[60px] max-w-[100px] bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(value, 100)}%` }}
                />
              </div>
              <span className="text-gray-900 font-medium min-w-[50px]">
                {formatPercent(value, { decimals: 2, showSign: false })}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('sharesHeld', {
        header: 'Shares',
        cell: (info) => formatNumber(info.getValue(), { decimals: 0 }),
      }),
      columnHelper.accessor('marketValue', {
        header: 'Value',
        cell: (info) => {
          const value = info.getValue();
          if (value === undefined) return '-';
          // Holdings are often in USD
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: displayData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });


  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {getSortIcon(header.id, sorting)}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!showAll && data.length > 10 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {expanded ? `Show Top 10` : `Show All ${data.length} Holdings`}
          </button>
        </div>
      )}
    </div>
  );
}
