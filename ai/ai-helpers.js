/**
 * @file ai/ai-helpers.js
 * @description Helper functions untuk AI Agent operations
 */

class AIHelpers {
  /**
   * Generate component name suggestions based on description
   */
  static suggestComponentName(description) {
    if (!description) return null;
    
    // Extract keywords
    const keywords = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    if (keywords.length === 0) return null;
    
    // Convert to PascalCase
    const name = keywords
      .slice(0, 3)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    return name;
  }

  /**
   * Validate component name format
   */
  static isValidComponentName(name) {
    if (!name || typeof name !== 'string') return false;
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }

  /**
   * Estimate complexity based on content
   */
  static estimateComplexity(content) {
    if (!content) return 'simple';
    
    const length = content.length;
    const hasMultipleFeatures = (content.match(/\band\b/gi) || []).length > 2;
    const hasConditionals = /\bif\b|\bwhen\b|\bdepending\b/i.test(content);
    
    if (length > 500 || hasMultipleFeatures || hasConditionals) {
      return 'complex';
    } else if (length > 200) {
      return 'medium';
    }
    
    return 'simple';
  }

  /**
   * Extract component type from description
   */
  static inferComponentType(description) {
    if (!description) return 'ui';
    
    const lower = description.toLowerCase();
    
    if (/button|card|modal|dialog|badge|avatar|icon/i.test(lower)) {
      return 'ui';
    } else if (/form|input|select|checkbox|radio/i.test(lower)) {
      return 'form';
    } else if (/nav|menu|breadcrumb|sidebar|header|footer/i.test(lower)) {
      return 'navigation';
    } else if (/grid|container|layout|section|wrapper/i.test(lower)) {
      return 'layout';
    } else if (/image|video|audio|gallery/i.test(lower)) {
      return 'media';
    } else if (/fetch|api|data|list|table/i.test(lower)) {
      return 'data';
    }
    
    return 'ui';
  }

  /**
   * Generate metadata from description
   */
  static generateMetadata(description, type) {
    return {
      prompt: description,
      complexity: this.estimateComplexity(description),
      inferredType: this.inferComponentType(description),
      suggestedName: this.suggestComponentName(description),
      timestamp: Date.now()
    };
  }

  /**
   * Validate batch operations
   */
  static validateBatchOperations(operations) {
    const errors = [];
    
    if (!Array.isArray(operations)) {
      return { valid: false, errors: ['Operations must be an array'] };
    }
    
    if (operations.length === 0) {
      return { valid: false, errors: ['At least one operation required'] };
    }
    
    operations.forEach((op, index) => {
      if (!op.type) {
        errors.push(`Operation ${index}: type is required`);
      }
      
      if (!op.data) {
        errors.push(`Operation ${index}: data is required`);
      }
      
      if (op.data && !op.data.name) {
        errors.push(`Operation ${index}: name is required in data`);
      }
      
      if (op.data && op.data.name && !this.isValidComponentName(op.data.name)) {
        errors.push(`Operation ${index}: invalid name format (must be PascalCase)`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format error response
   */
  static formatError(error, context = {}) {
    return {
      error: error.message || 'Unknown error',
      code: error.code || 'INTERNAL_ERROR',
      context,
      timestamp: Date.now(),
      suggestion: this.getErrorSuggestion(error)
    };
  }

  /**
   * Get suggestion based on error type
   */
  static getErrorSuggestion(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('validation')) {
      return 'Check /api/ai/contracts for valid schemas';
    } else if (message.includes('rate limit')) {
      return 'Wait before making more requests';
    } else if (message.includes('name')) {
      return 'Use PascalCase naming (e.g., MyComponent)';
    } else if (message.includes('not found')) {
      return 'Check if the resource exists';
    }
    
    return 'Check API documentation at /api/ai/contracts';
  }

  /**
   * Calculate success rate
   */
  static calculateSuccessRate(total, success) {
    if (total === 0) return '0%';
    return `${((success / total) * 100).toFixed(2)}%`;
  }

  /**
   * Format duration
   */
  static formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  /**
   * Format bytes
   */
  static formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}

export default AIHelpers;
