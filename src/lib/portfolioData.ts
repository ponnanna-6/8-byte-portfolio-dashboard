/**
 * Portfolio Data Service
 * Combines static portfolio data with real-time BSE/Yahoo Finance data
 */

import { PortfolioHolding } from '@/types/portfolio';
import { getPortfolioData } from './stockData';
import { fetchBSEData, isBSEScripcode, fetchMultipleBSEFundamentals, fetchMultipleBSEData, BSEFundamentalsData, searchBSEScripcode, BSEStockData } from './bseIndia';
import { loadFundamentalsCache, saveFundamentalsCache } from './fundamentalsCache';
import { loadScripcodeCache, saveScripcodeCache } from './scripcodeCache';
import { loadPriceCache, savePriceCache, savePriceToCache } from './priceCache';

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
 * Resolve BSE scripcode for a symbol (optimized - uses provided cache)
 */
async function resolveBSEScripcode(
  symbol: string,
  scripcodeCache: Map<string, string>
): Promise<{ symbol: string; scripcode: string | null }> {
  // If already a scripcode, return as-is
  if (isBSEScripcode(symbol)) {
    return { symbol, scripcode: symbol };
  }

  // Check cache first
  const cachedScripcode = scripcodeCache.get(symbol);
  if (cachedScripcode) {
    return { symbol, scripcode: cachedScripcode };
  }

  // Not in cache, search for it
  console.log(`Searching BSE scripcode for symbol: ${symbol}`);
  const scripcode = await searchBSEScripcode(symbol);
  
  if (scripcode) {
    // Add to cache (will be saved in batch later)
    scripcodeCache.set(symbol, scripcode);
    console.log(`Found BSE scripcode for ${symbol}: ${scripcode}`);
    return { symbol, scripcode };
  }

  console.warn(`Could not find BSE scripcode for symbol: ${symbol}`);
  return { symbol, scripcode: null };
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
 * Get portfolio data with real-time prices from BSE API (OPTIMIZED)
 */
export async function getPortfolioWithRealtimeData(): Promise<UpdatedPortfolioHolding[]> {
  const holdings = getPortfolioData();
  
  // OPTIMIZATION 1 & 2: Load caches once, get unique symbols
  const scripcodeCache = await loadScripcodeCache();
  const priceCache = await loadPriceCache();
  const uniqueSymbols = [...new Set(holdings.map(h => h.symbol))];
  
  // OPTIMIZATION 1: Resolve all scripcodes in parallel with deduplication
  const scripcodePromises = uniqueSymbols.map(symbol => 
    resolveBSEScripcode(symbol, scripcodeCache)
  );
  const resolved = await Promise.all(scripcodePromises);
  
  const symbolToScripcode = new Map<string, string>();
  const newMappings = new Map<string, string>();
  
  resolved.forEach(({ symbol, scripcode }) => {
    if (scripcode) {
      symbolToScripcode.set(symbol, scripcode);
      // Track new mappings for batch write
      if (!scripcodeCache.has(symbol)) {
        newMappings.set(symbol, scripcode);
      }
    }
  });
  
  // OPTIMIZATION 5: Batch write scripcode cache once
  if (newMappings.size > 0) {
    // Merge new mappings into existing cache
    newMappings.forEach((scripcode, symbol) => {
      scripcodeCache.set(symbol, scripcode);
    });
    await saveScripcodeCache(scripcodeCache);
  }
  
  // Collect all resolved BSE scripcodes (deduplicated)
  const uniqueScripcodes = [...new Set(Array.from(symbolToScripcode.values()))];
  
  // Fetch fundamentals once for all BSE stocks (cached for 24 hours)
  const fundamentalsMap = await getFundamentalsForBSEScripcodes(uniqueScripcodes);
  
  // OPTIMIZATION 3: Batch fetch prices (check cache first, then fetch missing)
  const scripcodesToFetch: string[] = [];
  const priceDataMap = new Map<string, BSEStockData>();
  
  // Check price cache first
  uniqueScripcodes.forEach(scripcode => {
    const cachedPrice = priceCache.get(scripcode);
    if (cachedPrice) {
      priceDataMap.set(scripcode, cachedPrice);
    } else {
      scripcodesToFetch.push(scripcode);
    }
  });
  
  // Fetch missing prices in batch
  if (scripcodesToFetch.length > 0) {
    console.log(`Fetching prices for ${scripcodesToFetch.length} scripcodes...`);
    const fetchedPrices = await fetchMultipleBSEData(scripcodesToFetch);
    
    // Merge fetched prices
    fetchedPrices.forEach((data: BSEStockData, scripcode: string) => {
      priceDataMap.set(scripcode, data);
    });
    
    // OPTIMIZATION 4: Save fetched prices to cache
    await savePriceCache(fetchedPrices);
  } else {
    console.log('Using cached price data for all scripcodes');
  }
  
  // Map holdings to updated format
  return holdings.map(holding => {
    const updatedHolding: UpdatedPortfolioHolding = { ...holding };
    const scripcode = symbolToScripcode.get(holding.symbol);

    if (scripcode) {
      try {
        const bseData = priceDataMap.get(scripcode);
        
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
        const bseFundamentals = fundamentalsMap.get(scripcode);
        if (bseFundamentals) {
          updatedHolding.fundamentals = mapBSEFundamentalsToPortfolio(
            bseFundamentals,
            holding.fundamentals
          );
        }
      } catch (error) {
        console.error(`Error processing BSE data for ${holding.symbol} (scripcode: ${scripcode}):`, error);
        // Keep existing data if processing fails
      }
    }

    return updatedHolding;
  });
}

/**
 * Get single holding with real-time data (OPTIMIZED)
 */
export async function getHoldingWithRealtimeData(symbol: string): Promise<UpdatedPortfolioHolding | null> {
  const holdings = getPortfolioData();
  const holding = holdings.find(h => h.symbol === symbol);

  if (!holding) {
    return null;
  }

  const updatedHolding: UpdatedPortfolioHolding = { ...holding };

  // Load caches
  const scripcodeCache = await loadScripcodeCache();
  const priceCache = await loadPriceCache();
  
  // Resolve symbol to BSE scripcode
  const { scripcode } = await resolveBSEScripcode(holding.symbol, scripcodeCache);
  
  // Save new mapping if found
  if (scripcode && !scripcodeCache.has(holding.symbol)) {
    scripcodeCache.set(holding.symbol, scripcode);
    await saveScripcodeCache(scripcodeCache);
  }

  if (scripcode) {
    try {
      // Check price cache first
      let bseData: BSEStockData | undefined = priceCache.get(scripcode);
      
      if (!bseData) {
        // Fetch if not in cache
        const fetched = await fetchBSEData(scripcode);
        if (fetched) {
          bseData = fetched;
          await savePriceToCache(scripcode, fetched);
        }
      }
      
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
      const fundamentalsMap = await getFundamentalsForBSEScripcodes([scripcode]);
      const bseFundamentals = fundamentalsMap.get(scripcode);
      if (bseFundamentals) {
        updatedHolding.fundamentals = mapBSEFundamentalsToPortfolio(
          bseFundamentals,
          holding.fundamentals
        );
      }
    } catch (error) {
      console.error(`Error fetching BSE data for ${holding.symbol} (scripcode: ${scripcode}):`, error);
    }
  }

  return updatedHolding;
}


