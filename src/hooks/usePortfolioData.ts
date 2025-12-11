'use client';

import { useState, useEffect } from 'react';
import { UpdatedPortfolioHolding } from '@/lib/portfolioData';

export function usePortfolioData() {
  const [holdings, setHoldings] = useState<UpdatedPortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from API route
      const response = await fetch('/api/portfolio/realtime');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      
      const data = await response.json();
      setHoldings(data.holdings);
      setLastUpdated(data.lastUpdated || new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { holdings, loading, error, lastUpdated, refetch: fetchData };
}

