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
import { PortfolioHolding } from '@/types/portfolio';
import { UpdatedPortfolioHolding } from '@/lib/portfolioData';
import { formatCurrency, formatNumber, getGainLossColor } from '@/utils/helpers';

const columnHelper = createColumnHelper<UpdatedPortfolioHolding>();

interface PortfolioTableProps {
  holdings: UpdatedPortfolioHolding[];
}

export default function PortfolioTable({ holdings }: PortfolioTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('companyName', {
        header: 'Particulars',
        cell: (info) => (
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('fixed.purchasePrice', {
        header: 'Purchase Price',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('fixed.qty', {
        header: 'Qty',
        cell: (info) => formatNumber(info.getValue()),
      }),
      columnHelper.accessor('fixed.investment', {
        header: 'Investment',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('fixed.portfolioPercent', {
        header: 'Portfolio (%)',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('symbol', {
        header: 'NSE/BSE',
        cell: (info) => (
          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('realtime.cmp', {
        header: 'CMP',
        cell: (info) => {
          const holding = info.row.original;
          const priceSource = holding.realtime?.priceSource;
          return (
            <div className="flex items-center gap-2">
              <span>{formatCurrency(info.getValue())}</span>
              {priceSource === 'bse' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" title="Live from BSE">
                  LIVE
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('realtime.presentValue', {
        header: 'Present Value',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('realtime.gainLoss', {
        header: 'Gain/Loss',
        cell: (info) => {
          const value = info.getValue();
          return (
            <span className={`font-semibold ${getGainLossColor(value)}`}>
              {formatCurrency(value)}
            </span>
          );
        },
      }),
      columnHelper.accessor('fundamentals.peTTM', {
        header: 'P/E Ratio',
        cell: (info) => {
          const value = info.getValue();
          return value ? formatNumber(value) : 'N/A';
        },
      }),
      columnHelper.accessor('fundamentals.latestEarnings', {
        header: 'Latest Earnings',
        cell: (info) => {
          const value = info.getValue();
          return value ? formatCurrency(value) : 'N/A';
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: holdings,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-900">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() && (
                      <span>
                        {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm whitespace-nowrap">
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

