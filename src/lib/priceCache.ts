/**
 * Price Cache Service
 * Caches BSE price data for 2-5 minutes to reduce API calls
 */

import { BSEStockData } from './bseIndia';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.cache');
const PRICE_CACHE_FILE = join(CACHE_DIR, 'price-cache.json');

interface CachedPrice {
  timestamp: number;
  data: BSEStockData;
}

interface PriceCache {
  [scripcode: string]: CachedPrice;
}

const PRICE_CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Check if cached price is still valid
 */
function isPriceCacheValid(timestamp: number): boolean {
  const now = Date.now();
  return (now - timestamp) < PRICE_CACHE_DURATION_MS;
}

/**
 * Load price cache
 */
export async function loadPriceCache(): Promise<Map<string, BSEStockData>> {
  try {
    const cacheContent = await readFile(PRICE_CACHE_FILE, 'utf-8');
    if (!cacheContent || cacheContent.trim() === '') {
      return new Map();
    }
    
    const cached: PriceCache = JSON.parse(cacheContent);
    const result = new Map<string, BSEStockData>();
    
    const now = Date.now();
    Object.entries(cached).forEach(([scripcode, cachedPrice]) => {
      if (isPriceCacheValid(cachedPrice.timestamp)) {
        result.set(scripcode, cachedPrice.data);
      }
    });
    
    return result;
  } catch (error) {
    return new Map();
  }
}

/**
 * Save price to cache
 */
export async function savePriceToCache(scripcode: string, data: BSEStockData): Promise<void> {
  try {
    const existing = await loadPriceCache();
    existing.set(scripcode, data);
    await savePriceCache(existing);
  } catch (error) {
    // Ignore errors - caching is optional
  }
}

/**
 * Save multiple prices to cache
 */
export async function savePriceCache(prices: Map<string, BSEStockData>): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    
    const cacheObject: PriceCache = {};
    prices.forEach((data, scripcode) => {
      cacheObject[scripcode] = {
        timestamp: Date.now(),
        data,
      };
    });
    
    await writeFile(PRICE_CACHE_FILE, JSON.stringify(cacheObject, null, 2), 'utf-8');
  } catch (error) {
    // Ignore errors
  }
}

