/**
 * @file ai/metrics-collector.js
 * @description Collect dan aggregate metrics untuk monitoring
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        failed: 0,
        byEndpoint: new Map()
      },
      generation: {
        components: 0,
        pages: 0,
        totalTime: 0,
        avgTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      errors: {
        total: 0,
        byType: new Map()
      }
    };
    
    this.startTime = Date.now();
  }

  recordRequest(endpoint, success, duration) {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }
    
    // Track by endpoint
    const endpointStats = this.metrics.requests.byEndpoint.get(endpoint) || {
      count: 0,
      success: 0,
      failed: 0,
      totalDuration: 0,
      avgDuration: 0
    };
    
    endpointStats.count++;
    if (success) endpointStats.success++;
    else endpointStats.failed++;
    
    if (duration) {
      endpointStats.totalDuration += duration;
      endpointStats.avgDuration = endpointStats.totalDuration / endpointStats.count;
    }
    
    this.metrics.requests.byEndpoint.set(endpoint, endpointStats);
  }

  recordGeneration(type, duration) {
    if (type === 'component') {
      this.metrics.generation.components++;
    } else if (type === 'page') {
      this.metrics.generation.pages++;
    }
    
    if (duration) {
      this.metrics.generation.totalTime += duration;
      const total = this.metrics.generation.components + this.metrics.generation.pages;
      this.metrics.generation.avgTime = this.metrics.generation.totalTime / total;
    }
  }

  recordCacheHit(hit) {
    if (hit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }
    
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 
      ? (this.metrics.cache.hits / total * 100).toFixed(2)
      : 0;
  }

  recordError(type) {
    this.metrics.errors.total++;
    const count = this.metrics.errors.byType.get(type) || 0;
    this.metrics.errors.byType.set(type, count + 1);
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      timestamp: Date.now(),
      requests: {
        ...this.metrics.requests,
        byEndpoint: Object.fromEntries(this.metrics.requests.byEndpoint)
      },
      errors: {
        ...this.metrics.errors,
        byType: Object.fromEntries(this.metrics.errors.byType)
      }
    };
  }

  reset() {
    this.metrics = {
      requests: { total: 0, success: 0, failed: 0, byEndpoint: new Map() },
      generation: { components: 0, pages: 0, totalTime: 0, avgTime: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0 },
      errors: { total: 0, byType: new Map() }
    };
    this.startTime = Date.now();
  }
}

export default MetricsCollector;
