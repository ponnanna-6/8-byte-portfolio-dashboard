'use client';

import { SectorSummary as SectorSummaryType } from '@/types/portfolio';
import { formatCurrency, getGainLossColor } from '@/utils/helpers';
import PortfolioTable from './PortfolioTable';

interface SectorSummaryProps {
  summary: SectorSummaryType;
}

export default function SectorSummary({ summary }: SectorSummaryProps) {
  const gainLossPercentNum = summary.totalInvestment > 0
    ? (summary.totalGainLoss / summary.totalInvestment) * 100
    : 0;
  const gainLossPercent = gainLossPercentNum.toFixed(2);

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {summary.sector} Sector
          </h2>
          <div className="flex gap-6">
            <div className="text-right">
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Investment</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(summary.totalInvestment)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 dark:text-gray-400">Present Value</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(summary.totalPresentValue)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 dark:text-gray-400">Gain/Loss</div>
              <div className={`text-sm font-semibold ${getGainLossColor(summary.totalGainLoss)}`}>
                {formatCurrency(summary.totalGainLoss)} ({gainLossPercentNum >= 0 ? '+' : ''}{gainLossPercent}%)
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <PortfolioTable holdings={summary.holdings} />
      </div>
    </div>
  );
}

