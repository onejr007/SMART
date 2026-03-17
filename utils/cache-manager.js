/**
 * Simple In-Memory Cache Manager
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            keys: 0
        };
    }

    /**
     * Set a value in the cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttl Time to live in milliseconds (default 30s)
     */
    set(key, value, ttl = 30000) {
        const expiresAt = Date.now() + ttl;
        this.cache.set(key, { value, expiresAt });
        this.stats.keys = this.cache.size;
    }

    /**
     * Get a value from the cache
     * @param {string} key 
     * @returns {any|null}
     */
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.stats.misses++;
            return null;
        }

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.keys = this.cache.size;
            return null;
        }

        this.stats.hits++;
        return item.value;
    }

    /**
     * Delete a key from the cache
     * @param {string} key 
     */
    delete(key) {
        this.cache.delete(key);
        this.stats.keys = this.cache.size;
    }

    /**
     * Clear the entire cache
     */
    clear() {
        this.cache.clear();
        this.stats.keys = 0;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            ...this.stats,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses || 1)
        };
    }
}

export const cacheManager = new CacheManager();
