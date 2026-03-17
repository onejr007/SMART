/**
 * @file ai/rate-limiter.js
 * @description Rate limiting untuk mencegah abuse dan overload
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute default
    this.maxRequests = options.maxRequests || 100;
    this.requests = new Map();
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), this.windowMs);
  }

  check(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Filter requests within window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (recentRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: Math.min(...recentRequests) + this.windowMs
      };
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return {
      allowed: true,
      remaining: this.maxRequests - recentRequests.length,
      resetAt: now + this.windowMs
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [identifier, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(t => now - t < this.windowMs);
      if (recent.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recent);
      }
    }
  }

  reset(identifier) {
    this.requests.delete(identifier);
  }
}

export default RateLimiter;
