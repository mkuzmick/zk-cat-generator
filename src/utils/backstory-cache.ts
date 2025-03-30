/**
 * Simple in-memory cache for storing and retrieving cat backstories
 * This helps solve the issue where the backstory isn't properly passed
 * between API endpoints
 */

// Type for cache entry
interface BackstoryCacheEntry {
  backstory: string;
  timestamp: number; // When this entry was created
}

// The actual cache storage
const backstoryCache: Record<string, BackstoryCacheEntry> = {};

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION_MS = 30 * 60 * 1000;

/**
 * Save a cat's backstory to the cache
 * @param name The cat's name (used as key)
 * @param backstory The full backstory text
 */
export function saveBackstory(name: string, backstory: string): void {
  if (!name || !backstory) return;
  
  // Clean up expired entries first
  cleanExpiredEntries();
  
  backstoryCache[name] = {
    backstory,
    timestamp: Date.now()
  };
  
  console.log(`[backstory-cache] Saved backstory for ${name}, length: ${backstory.length}`);
}

/**
 * Retrieve a cat's backstory from the cache
 * @param name The cat's name
 * @returns The backstory text or empty string if not found
 */
export function getBackstory(name: string): string {
  if (!name || !backstoryCache[name]) return '';
  
  const entry = backstoryCache[name];
  
  // Check if entry is expired
  if (Date.now() - entry.timestamp > CACHE_EXPIRATION_MS) {
    console.log(`[backstory-cache] Entry for ${name} has expired`);
    delete backstoryCache[name];
    return '';
  }
  
  console.log(`[backstory-cache] Retrieved backstory for ${name}, length: ${entry.backstory.length}`);
  return entry.backstory;
}

/**
 * Remove expired entries from the cache
 */
function cleanExpiredEntries(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  Object.keys(backstoryCache).forEach(key => {
    if (now - backstoryCache[key].timestamp > CACHE_EXPIRATION_MS) {
      delete backstoryCache[key];
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`[backstory-cache] Cleaned up ${cleanedCount} expired entries`);
  }
}
