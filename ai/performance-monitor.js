/**
 * @file ai/performance-monitor.js
 * @description Performance monitoring and optimization for AI operations
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      componentGeneration: 2000, // 2s
      pageGeneration: 3000, // 3s
      apiResponse: 1000, // 1s
      fileOperation: 500 // 500ms
    };
  }

  /**
   * Start tracking an operation
   * @param {string} operationId - Unique identifier for the operation
   * @param {string} type - Type of operation
   */
  start(operationId, type) {
    this.metrics.set(operationId, {
      type,
      startTime: Date.now(),
      startMemory: process.memoryUsage().heapUsed
    });
  }

  /**
   * End tracking and return metrics
   * @param {string} operationId - Operation identifier
   * @returns {Object} Performance metrics
   */
  end(operationId) {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      console.warn(`No metric found for operation: ${operationId}`);
      return null;
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    const result = {
      type: metric.type,
      duration: endTime - metric.startTime,
      memoryDelta: endMemory - metric.startMemory,
      timestamp: endTime
    };

    // Check if operation exceeded threshold
    const threshold = this.thresholds[metric.type] || 1000;
    if (result.duration > threshold) {
      console.warn(`⚠️ Slow operation detected: ${metric.type} took ${result.duration}ms (threshold: ${threshold}ms)`);
    }

    this.metrics.delete(operationId);
    return result;
  }

  /**
   * Get performance summary
   * @returns {Object} Summary of all metrics
   */
  getSummary() {
    const summary = {
      activeOperations: this.metrics.size,
      thresholds: this.thresholds
    };

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }
}

export default PerformanceMonitor;
