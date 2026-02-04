'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { ExternalLink } from 'lucide-react';
import type { Holding } from '@/types';
import { formatCurrency, formatPercent, formatNumber, getSortIcon, getTrendColor } from '@/lib/utils';

interface HoldingsTableProps {
  data: Holding[];
}

const columnHelper = createColumnHelper<Holding>();

export function HoldingsTable({ data }: HoldingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'gainLossPercent', desc: true }]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Fund',
        cell: (info) => (
          <Link
            href={`/funds/${encodeURIComponent(info.row.original.symbol)}`}
            className="block group"
          >
            <div className="font-medium text-gray-900 group-hover:text-blue-600 flex items-center gap-1">
              {info.getValue()}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-gray-500">{info.row.original.symbol}</div>
          </Link>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: 'Units',
        cell: (info) => formatNumber(info.getValue(), { decimals: 4 }),
      }),
      columnHelper.accessor('bookCost', {
        header: 'Book Cost',
        cell: (info) => formatCurrency(info.getValue(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      }),
      columnHelper.accessor('marketValue', {
        header: 'Market Value',
        cell: (info) => formatCurrency(info.getValue(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      }),
      columnHelper.accessor('gainLoss', {
        header: 'Gain/Loss',
        cell: (info) => {
          const value = info.getValue();
          const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600';
          return <span className={colorClass}>{formatCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
        },
      }),
      columnHelper.accessor('gainLossPercent', {
        header: '%',
        cell: (info) => {
          const value = info.getValue();
          const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600';
          return <span className={colorClass}>{formatPercent(value, { decimals: 2 })}</span>;
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });


  return (
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
  );
}
