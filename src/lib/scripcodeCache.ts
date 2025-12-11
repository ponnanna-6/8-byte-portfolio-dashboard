/**
 * Scripcode Cache Service
 * Caches symbol-to-BSE-scripcode mappings permanently (one-time fetch)
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.cache');
const SCRIPCODE_CACHE_FILE = join(CACHE_DIR, 'scripcode-mapping.json');

interface ScripcodeMapping {
  [symbol: string]: string; // symbol -> scripcode
}

/**
 * Load symbol-to-scripcode mappings from cache
 */
export async function loadScripcodeCache(): Promise<Map<string, string>> {
  try {
    const cacheContent = await readFile(SCRIPCODE_CACHE_FILE, 'utf-8');
    if (!cacheContent || cacheContent.trim() === '') {
      return new Map();
    }
    
    const cached: ScripcodeMapping = JSON.parse(cacheContent);
    return new Map(Object.entries(cached));
  } catch (error) {
    // Cache doesn't exist - return empty map
    return new Map();
  }
}

/**
 * Save symbol-to-scripcode mappings to cache
 */
export async function saveScripcodeCache(mappings: Map<string, string>): Promise<void> {
  try {
    // Ensure cache directory exists
    await mkdir(CACHE_DIR, { recursive: true });
    
    // Convert Map to object for JSON serialization
    const mappingObject: ScripcodeMapping = {};
    mappings.forEach((scripcode, symbol) => {
      mappingObject[symbol] = scripcode;
    });
    
    await writeFile(SCRIPCODE_CACHE_FILE, JSON.stringify(mappingObject, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving scripcode cache:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Add a single symbol-to-scripcode mapping to cache
 */
export async function addScripcodeMapping(symbol: string, scripcode: string): Promise<void> {
  const existing = await loadScripcodeCache();
  existing.set(symbol, scripcode);
  await saveScripcodeCache(existing);
}

