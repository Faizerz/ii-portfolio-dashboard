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
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  bookCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  hasYahooSymbol: boolean;
}

interface HoldingsTableProps {
  data: Holding[];
}

const columnHelper = createColumnHelper<Holding>();

export function HoldingsTable({ data }: HoldingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'gainLossPercent', desc: true }]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatQuantity = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Fund',
        cell: (info) => (
          <Link
            href={`/funds/${encodeURIComponent(info.row.original.symbol)}`}
            className="block group"
          >
            <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1">
              {info.getValue()}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{info.row.original.symbol}</div>
          </Link>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: 'Units',
        cell: (info) => formatQuantity(info.getValue()),
      }),
      columnHelper.accessor('bookCost', {
        header: 'Book Cost',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('marketValue', {
        header: 'Market Value',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('gainLoss', {
        header: 'Gain/Loss',
        cell: (info) => {
          const value = info.getValue();
          const colorClass = value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
          return <span className={colorClass}>{formatCurrency(value)}</span>;
        },
      }),
      columnHelper.accessor('gainLossPercent', {
        header: '%',
        cell: (info) => {
          const value = info.getValue();
          const colorClass = value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
          return <span className={colorClass}>{formatPercent(value)}</span>;
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

  const getSortIcon = (columnId: string) => {
    const sortedColumn = sorting.find((s) => s.id === columnId);
    if (!sortedColumn) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortedColumn.desc ? (
      <ArrowDown className="w-4 h-4 ml-1" />
    ) : (
      <ArrowUp className="w-4 h-4 ml-1" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-gray-700">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {getSortIcon(header.id)}
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
              className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-gray-900 dark:text-gray-100">
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
