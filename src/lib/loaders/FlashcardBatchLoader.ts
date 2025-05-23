import type { FlashcardDueDto, SessionOptions } from "@/types";

/**
 * Cache settings
 */
const CACHE_SETTINGS = {
  TTL_MS: 5 * 60 * 1000, // 5 minutes cache expiration
  MAX_CACHED_BATCHES: 3  // Maximum number of batches to keep in cache
};

/**
 * Cached batch of flashcards
 */
interface CachedBatch {
  key: string;
  data: FlashcardDueDto[];
  timestamp: number;
}

/**
 * FlashcardBatchLoader handles efficiently loading flashcards from the API in batches.
 * It implements caching to improve performance and reduce API calls.
 */
export class FlashcardBatchLoader {
  private _cache: Map<string, CachedBatch> = new Map();
  
  /**
   * Load a batch of flashcards with the given options
   * @param options Session options containing collection_id, category_id, and limit
   * @param forceRefresh Whether to bypass cache and force a fresh load
   * @returns Promise resolving to an array of flashcards due for review
   */
  public async loadBatch(options: SessionOptions, forceRefresh: boolean = false): Promise<FlashcardDueDto[]> {
    // Generate cache key from options
    const cacheKey = this._generateCacheKey(options);
    
    // Check if we have a valid cached response
    if (!forceRefresh) {
      const cachedBatch = this._getCachedBatch(cacheKey);
      if (cachedBatch) {
        console.log('[FlashcardBatchLoader] Serving batch from cache');
        return cachedBatch;
      }
    }
    
    // No cache hit, load from API
    console.log('[FlashcardBatchLoader] Loading batch from API');
    try {
      const flashcards = await this._fetchFromApi(options);
      
      // Cache the result if we got data
      if (flashcards.length > 0) {
        this._cacheBatch(cacheKey, flashcards);
      }
      
      return flashcards;
    } catch (error) {
      console.error('[FlashcardBatchLoader] Error loading batch:', error);
      throw error;
    }
  }
  
  /**
   * Prefetch the next batch of flashcards based on given options
   * @param options Session options for the batch to prefetch
   * @returns Promise that resolves when prefetching is complete
   */
  public async prefetchNextBatch(options: SessionOptions): Promise<void> {
    // Just load the batch - it will be cached automatically
    try {
      // Clone options and adjust for next batch
      const nextOptions = { ...options };
      
      // In a real implementation, you'd need to know how to get the "next" batch
      // For this example, we'll just increase the limit to simulate loading more
      if (nextOptions.limit) {
        nextOptions.limit += 10;
      }
      
      await this.loadBatch(nextOptions);
      console.log('[FlashcardBatchLoader] Successfully prefetched next batch');
    } catch (error) {
      console.error('[FlashcardBatchLoader] Error prefetching next batch:', error);
      // Swallow error for prefetch - it's a background operation
    }
  }
  
  /**
   * Clear the cache
   */
  public clearCache(): void {
    this._cache.clear();
    console.log('[FlashcardBatchLoader] Cache cleared');
  }
  
  /**
   * Fetch flashcards from the API
   * @param options Session options
   * @returns Promise resolving to flashcards
   */
  private async _fetchFromApi(options: SessionOptions): Promise<FlashcardDueDto[]> {
    // Build API URL with options
    let url = '/api/flashcards/due';
    const params = new URLSearchParams();
    
    if (options.collection_id) {
      params.append('collection_id', options.collection_id);
    }
    
    if (options.category_id) {
      params.append('category_id', options.category_id);
    }
    
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    // Fetch from API
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Get a cached batch if available and not expired
   * @param key Cache key
   * @returns Cached flashcards or null if not found/expired
   */
  private _getCachedBatch(key: string): FlashcardDueDto[] | null {
    const cached = this._cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache has expired
    const now = Date.now();
    if (now - cached.timestamp > CACHE_SETTINGS.TTL_MS) {
      // Cache expired, remove it
      this._cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Cache a batch of flashcards
   * @param key Cache key
   * @param data Flashcards to cache
   */
  private _cacheBatch(key: string, data: FlashcardDueDto[]): void {
    // If cache is at max capacity, remove oldest item
    if (this._cache.size >= CACHE_SETTINGS.MAX_CACHED_BATCHES) {
      let oldestKey: string | null = null;
      let oldestTimestamp = Infinity;
      
      // Find oldest cache entry
      for (const [entryKey, entry] of this._cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = entryKey;
        }
      }
      
      // Remove oldest entry
      if (oldestKey) {
        this._cache.delete(oldestKey);
      }
    }
    
    // Add new cache entry
    this._cache.set(key, {
      key,
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Generate a cache key from session options
   * @param options Session options
   * @returns Cache key string
   */
  private _generateCacheKey(options: SessionOptions): string {
    const { collection_id, category_id, limit } = options;
    return `${collection_id || 'all'}-${category_id || 'all'}-${limit || 'default'}`;
  }
} 