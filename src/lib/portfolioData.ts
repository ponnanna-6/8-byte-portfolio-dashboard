/**
 * Portfolio Data Service
 * Combines static portfolio data with real-time BSE/Yahoo Finance data
 */

import { PortfolioHolding } from '@/types/portfolio';
import { getPortfolioData } from './stockData';
import { fetchBSEData, isBSEScripcode, fetchMultipleBSEFundamentals, BSEFundamentalsData } from './bseIndia';
import { loadFundamentalsCache, saveFundamentalsCache } from './fundamentalsCache';

export interface UpdatedPortfolioHolding extends PortfolioHolding {
  realtime: PortfolioHolding['realtime'] & {
    lastUpdated?: string;
    priceSource?: 'bse' | 'yahoo' | 'static';
  };
}

/**
 * Map BSE fundamentals to portfolio fundamentals structure
 */
function mapBSEFundamentalsToPortfolio(bseFundamentals: BSEFundamentalsData, existingFundamentals: PortfolioHolding['fundamentals']): PortfolioHolding['fundamentals'] {
  return {
    ...existingFundamentals,
    // Update with BSE data where available
    peTTM: bseFundamentals.pe ?? existingFundamentals.peTTM,
    priceToBook: bseFundamentals.pb ?? existingFundamentals.priceToBook,
    latestEarnings: bseFundamentals.eps ?? existingFundamentals.latestEarnings,
    // Keep other fields from existing fundamentals
  };
}

/**
 * Get and cache fundamentals for all BSE scripcodes
 */
async function getFundamentalsForBSEScripcodes(scripcodes: string[]): Promise<Map<string, BSEFundamentalsData>> {
  if (scripcodes.length === 0) {
    return new Map();
  }

  // Try to load from cache first
  const cached = await loadFundamentalsCache();
  const result = cached ? new Map(cached) : new Map<string, BSEFundamentalsData>();
  
  // Check which scripcodes are missing from cache
  const missingScripcodes = scripcodes.filter(sc => !result.has(sc));
  
  if (missingScripcodes.length === 0) {
    console.log('Using cached fundamentals data for all scripcodes');
    return result;
  }

  // Only fetch missing scripcodes (minimize API calls)
  console.log(`Fetching fundamentals for ${missingScripcodes.length} missing scripcodes...`);
  const fetchedFundamentals = await fetchMultipleBSEFundamentals(missingScripcodes);
  
  // Merge fetched data into result
  fetchedFundamentals.forEach((value, key) => result.set(key, value));
  
  // Save updated cache (includes both cached and newly fetched)
  await saveFundamentalsCache(result);
  
  return result;
}

/**
 * Get portfolio data with real-time prices from BSE API
 */
export async function getPortfolioWithRealtimeData(): Promise<UpdatedPortfolioHolding[]> {
  const holdings = getPortfolioData();
  const updatedHoldings: UpdatedPortfolioHolding[] = [];

  // Collect all BSE scripcodes for batch fundamentals fetch
  const bseScripcodes = holdings
    .filter(h => isBSEScripcode(h.symbol))
    .map(h => h.symbol);

  // Fetch fundamentals once for all BSE stocks (cached for 24 hours)
  const fundamentalsMap = await getFundamentalsForBSEScripcodes(bseScripcodes);

  for (const holding of holdings) {
    const updatedHolding: UpdatedPortfolioHolding = { ...holding };

    // Check if symbol is a BSE scripcode
    if (isBSEScripcode(holding.symbol)) {
      try {
        // Fetch real-time price data
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

        // Update fundamentals from BSE API (cached)
        const bseFundamentals = fundamentalsMap.get(holding.symbol);
        if (bseFundamentals) {
          updatedHolding.fundamentals = mapBSEFundamentalsToPortfolio(
            bseFundamentals,
            holding.fundamentals
          );
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
      // Fetch real-time price data
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

      // Fetch fundamentals (will use cache if available)
      const fundamentalsMap = await getFundamentalsForBSEScripcodes([holding.symbol]);
      const bseFundamentals = fundamentalsMap.get(holding.symbol);
      if (bseFundamentals) {
        updatedHolding.fundamentals = mapBSEFundamentalsToPortfolio(
          bseFundamentals,
          holding.fundamentals
        );
      }
    } catch (error) {
      console.error(`Error fetching BSE data for ${holding.symbol}:`, error);
    }
  }

  return updatedHolding;
}

