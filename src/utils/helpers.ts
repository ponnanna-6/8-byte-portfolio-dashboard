export function formatCurrency(value: number): string {
  // Format with Indian number system (lakhs, crores)
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(2)}K`;
  }
  return `₹${value.toFixed(2)}`;
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: string | number): string {
  if (typeof value === 'string') {
    return value;
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function getGainLossColor(gainLoss: number): string {
  if (gainLoss > 0) return 'text-green-600 dark:text-green-400';
  if (gainLoss < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}

export function getGainLossBgColor(gainLoss: number): string {
  if (gainLoss > 0) return 'bg-green-50 dark:bg-green-900/20';
  if (gainLoss < 0) return 'bg-red-50 dark:bg-red-900/20';
  return 'bg-gray-50 dark:bg-gray-900/20';
}

