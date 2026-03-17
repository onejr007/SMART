/**
 * @file ai/request-validator.js
 * @description Validasi request untuk keamanan dan konsistensi
 */

class RequestValidator {
  constructor() {
    this.maxNameLength = 50;
    this.maxContentLength = 50000;
    this.maxBatchSize = 50;
    this.namePattern = /^[A-Z][a-zA-Z0-9]*$/;
  }

  validateComponentName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Name is required and must be a string' };
    }
    
    if (name.length > this.maxNameLength) {
      return { valid: false, error: `Name too long (max ${this.maxNameLength} chars)` };
    }
    
    if (!this.namePattern.test(name)) {
      return { valid: false, error: 'Name must be PascalCase (e.g., MyComponent)' };
    }
    
    return { valid: true };
  }

  validateContent(content) {
    if (content && content.length > this.maxContentLength) {
      return { valid: false, error: `Content too large (max ${this.maxContentLength} chars)` };
    }
    return { valid: true };
  }

  validateBatchSize(operations) {
    if (!Array.isArray(operations)) {
      return { valid: false, error: 'Operations must be an array' };
    }
    
    if (operations.length === 0) {
      return { valid: false, error: 'At least one operation required' };
    }
    
    if (operations.length > this.maxBatchSize) {
      return { valid: false, error: `Too many operations (max ${this.maxBatchSize})` };
    }
    
    return { valid: true };
  }

  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '')
      .trim();
  }
}

export default RequestValidator;
