/**
 * Fundamentals Cache Service
 * Caches BSE fundamentals data for 24 hours to minimize API calls
 */

import { BSEFundamentalsData } from './bseIndia';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.cache');
const CACHE_FILE = join(CACHE_DIR, 'fundamentals-cache.json');

interface CachedFundamentals {
  timestamp: number;
  data: [string, BSEFundamentalsData][] | Record<string, BSEFundamentalsData>;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if cache is valid (less than 24 hours old)
 */
function isCacheValid(timestamp: number): boolean {
  const now = Date.now();
  return (now - timestamp) < CACHE_DURATION_MS;
}

/**
 * Load fundamentals from cache
 */
export async function loadFundamentalsCache(): Promise<Map<string, BSEFundamentalsData> | null> {
  try {
    const cacheContent = await readFile(CACHE_FILE, 'utf-8');
    if (!cacheContent || cacheContent.trim() === '') {
      return null;
    }
    
    const cached: CachedFundamentals = JSON.parse(cacheContent);
    
    if (!cached.timestamp || !cached.data) {
      return null;
    }
    
    if (isCacheValid(cached.timestamp)) {
      // Convert array back to Map
      const dataMap = new Map<string, BSEFundamentalsData>();
      if (Array.isArray(cached.data)) {
        // Handle array format from JSON
        cached.data.forEach((item: [string, BSEFundamentalsData]) => {
          dataMap.set(item[0], item[1]);
        });
      } else if (typeof cached.data === 'object') {
        // Handle object format
        Object.entries(cached.data).forEach(([key, value]) => {
          dataMap.set(key, value as BSEFundamentalsData);
        });
      }
      return dataMap;
    }
    return null;
  } catch (error) {
    // Cache doesn't exist or is invalid
    return null;
  }
}

/**
 * Save fundamentals to cache
 */
export async function saveFundamentalsCache(data: Map<string, BSEFundamentalsData>): Promise<void> {
  try {
    // Ensure cache directory exists
    await mkdir(CACHE_DIR, { recursive: true });
    
    const cached: CachedFundamentals = {
      timestamp: Date.now(),
      data: Array.from(data.entries()), // Convert Map to array for JSON serialization
    };
    
    await writeFile(CACHE_FILE, JSON.stringify(cached, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving fundamentals cache:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Clear the fundamentals cache (useful for testing or forced refresh)
 */
export async function clearFundamentalsCache(): Promise<void> {
  try {
    await writeFile(CACHE_FILE, '', 'utf-8');
  } catch (error) {
    // Ignore errors
  }
}

