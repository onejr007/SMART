/**
 * @file ai/error-handler.js
 * @description Centralized error handling for AI operations
 */

class AIErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  /**
   * Handle and log an error
   * @param {Error} error - The error object
   * @param {Object} context - Additional context
   * @returns {Object} Formatted error response
   */
  handle(error, context = {}) {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      type: error.name || 'Error'
    };

    this.errors.push(errorEntry);
    
    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console
    console.error(`[AI Error] ${error.message}`, context);

    return {
      error: error.message,
      type: errorEntry.type,
      timestamp: errorEntry.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
  }

  /**
   * Get recent errors
   * @param {number} limit - Number of errors to return
   * @returns {Array} Recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errors.slice(-limit).reverse();
  }

  /**
   * Clear error history
   */
  clear() {
    this.errors = [];
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats() {
    const errorTypes = this.errors.reduce((acc, err) => {
      acc[err.type] = (acc[err.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: this.errors.length,
      types: errorTypes,
      recent: this.getRecentErrors(5)
    };
  }
}

export default AIErrorHandler;
