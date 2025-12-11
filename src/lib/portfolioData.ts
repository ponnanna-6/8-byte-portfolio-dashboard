/**
 * Portfolio Data Service
 * Combines static portfolio data with real-time BSE/Yahoo Finance data
 */

import { PortfolioHolding } from '@/types/portfolio';
import { getPortfolioData } from './stockData';
import { fetchBSEData, isBSEScripcode } from './bseIndia';

export interface UpdatedPortfolioHolding extends PortfolioHolding {
  realtime: PortfolioHolding['realtime'] & {
    lastUpdated?: string;
    priceSource?: 'bse' | 'yahoo' | 'static';
  };
}

/**
 * Get portfolio data with real-time prices from BSE API
 */
export async function getPortfolioWithRealtimeData(): Promise<UpdatedPortfolioHolding[]> {
  const holdings = getPortfolioData();
  const updatedHoldings: UpdatedPortfolioHolding[] = [];

  for (const holding of holdings) {
    const updatedHolding: UpdatedPortfolioHolding = { ...holding };

    // Check if symbol is a BSE scripcode
    if (isBSEScripcode(holding.symbol)) {
      try {
        const bseData = await fetchBSEData(holding.symbol);
        
        if (bseData) {
          // Calculate updated values
          const newPresentValue = bseData.currentPrice * holding.fixed.qty;
          const newGainLoss = newPresentValue - holding.fixed.investment;
          const newGainLossPercent = holding.fixed.investment > 0
            ? ((newGainLoss / holding.fixed.investment) * 100).toFixed(2)
            : '0.00';
          
          // Update realtime data with BSE API data
          updatedHolding.realtime = {
            ...holding.realtime,
            cmp: bseData.currentPrice,
            presentValue: newPresentValue,
            gainLoss: newGainLoss,
            gainLossPercent: `${newGainLoss >= 0 ? '+' : ''}${newGainLossPercent}%`,
            marketCap: holding.realtime.marketCap, // Keep existing if available
            lastUpdated: bseData.lastUpdated,
            priceSource: 'bse',
          };
        }
      } catch (error) {
        console.error(`Error fetching BSE data for ${holding.symbol}:`, error);
        // Keep existing data if API fails
      }
    }

    updatedHoldings.push(updatedHolding);
  }

  return updatedHoldings;
}

/**
 * Get single holding with real-time data
 */
export async function getHoldingWithRealtimeData(symbol: string): Promise<UpdatedPortfolioHolding | null> {
  const holdings = getPortfolioData();
  const holding = holdings.find(h => h.symbol === symbol);

  if (!holding) {
    return null;
  }

  const updatedHolding: UpdatedPortfolioHolding = { ...holding };

  // Check if symbol is a BSE scripcode
  if (isBSEScripcode(holding.symbol)) {
    try {
      const bseData = await fetchBSEData(holding.symbol);
      
      if (bseData) {
        const newPresentValue = bseData.currentPrice * holding.fixed.qty;
        const newGainLoss = newPresentValue - holding.fixed.investment;
        const newGainLossPercent = holding.fixed.investment > 0
          ? ((newGainLoss / holding.fixed.investment) * 100).toFixed(2)
          : '0.00';
        
        updatedHolding.realtime = {
          ...holding.realtime,
          cmp: bseData.currentPrice,
          presentValue: newPresentValue,
          gainLoss: newGainLoss,
          gainLossPercent: `${newGainLoss >= 0 ? '+' : ''}${newGainLossPercent}%`,
          marketCap: holding.realtime.marketCap,
          lastUpdated: bseData.lastUpdated,
          priceSource: 'bse',
        };
      }
    } catch (error) {
      console.error(`Error fetching BSE data for ${holding.symbol}:`, error);
    }
  }

  return updatedHolding;
}

