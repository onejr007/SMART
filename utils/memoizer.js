/**
 * Simple Request Memoization Helper
 */
class RequestMemoizer {
    constructor() {
        this.memo = new Map();
        this.ttl = 5000; // Default 5s TTL for memoized requests
    }

    /**
     * Memoize an expensive function/request
     * @param {string} key Unique key for the request
     * @param {Function} fn Function to execute
     * @param {number} ttl Custom TTL in ms
     * @returns {Promise<any>}
     */
    async memoize(key, fn, ttl = this.ttl) {
        const now = Date.now();
        const cached = this.memo.get(key);

        if (cached && (now - cached.timestamp < ttl)) {
            return cached.data;
        }

        const data = await fn();
        this.memo.set(key, { data, timestamp: now });
        
        // Auto-cleanup after TTL to save memory
        setTimeout(() => {
            const current = this.memo.get(key);
            if (current && current.timestamp === now) {
                this.memo.delete(key);
            }
        }, ttl);

        return data;
    }

    /**
     * Clear memoized data for a key
     * @param {string} key 
     */
    clear(key) {
        this.memo.delete(key);
    }
}

export const memoizer = new RequestMemoizer();
