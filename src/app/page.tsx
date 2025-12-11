'use client';

import { useMemo } from 'react';
import { getSectorSummaries } from '@/lib/stockData';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import SectorSummary from '@/components/SectorSummary';
import { formatCurrency, getGainLossColor } from '@/utils/helpers';

export default function Home() {
  const { holdings, loading, lastUpdated } = usePortfolioData();
  
  const sectorSummaries = useMemo(() => {
    if (holdings.length === 0) return [];
    return getSectorSummaries(holdings);
  }, [holdings]);

  const totalInvestment = holdings.reduce((sum, h) => sum + h.fixed.investment, 0);
  const totalPresentValue = holdings.reduce((sum, h) => sum + h.realtime.presentValue, 0);
  const totalGainLoss = totalPresentValue - totalInvestment;
  const totalGainLossPercent = totalInvestment > 0
    ? ((totalGainLoss / totalInvestment) * 100).toFixed(2)
    : '0.00';

  if (loading && holdings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Portfolio Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Real-time insights into your investment portfolio
              </p>
            </div>
            {lastUpdated && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated}
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Investment
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalInvestment)}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Current Value
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalPresentValue)}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Gain/Loss
            </div>
            <div className={`mt-2 text-2xl font-bold ${getGainLossColor(totalGainLoss)}`}>
              {formatCurrency(totalGainLoss)} ({totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent}%)
            </div>
          </div>
        </div>

        {/* Sector Summaries */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Holdings by Sector
          </h2>
          {sectorSummaries.map((summary) => (
            <SectorSummary key={summary.sector} summary={summary} />
          ))}
        </div>
      </div>
    </div>
  );
}
