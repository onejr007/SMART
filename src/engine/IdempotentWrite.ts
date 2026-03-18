/**
 * IdempotentWrite.ts
 * [P0] Idempotent writes
 * Gunakan request-id untuk operasi penting agar retry aman
 */

export interface WriteRequest {
  requestId: string;
  operation: string;
  data: any;
  timestamp: number;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
}

export interface IdempotentConfig {
  requestTTL: number; // ms - how long to keep completed requests
  maxRetries: number;
  retryDelay: number; // ms
  enableDeduplication: boolean;
}

export const DEFAULT_IDEMPOTENT_CONFIG: IdempotentConfig = {
  requestTTL: 3600000, // 1 hour
  maxRetries: 3,
  retryDelay: 1000,
  enableDeduplication: true
};

export class IdempotentWriteManager {
  private config: IdempotentConfig;
  private requestCache: Map<string, WriteRequest> = new Map();
  private processingRequests: Set<string> = new Set();
  
  constructor(config: IdempotentConfig = DEFAULT_IDEMPOTENT_CONFIG) {
    this.config = { ...config };
    this.startCleanupTimer();
  }
  
  private startCleanupTimer(): void {
    // Clean up old completed requests every 5 minutes
    setInterval(() => {
      this.cleanupOldRequests();
    }, 300000);
  }
  
  private cleanupOldRequests(): void {
    const now = Date.now();
    const cutoffTime = now - this.config.requestTTL;
    
    for (const [requestId, request] of this.requestCache.entries()) {
      if (request.status === 'completed' && request.timestamp < cutoffTime) {
        this.requestCache.delete(requestId);
      }
    }
    
    console.log(`🧹 Cleaned up old idempotent requests. Cache size: ${this.requestCache.size}`);
  }
  
  public generateRequestId(userId: string, operation: string, data: any): string {
    // Generate deterministic request ID based on operation and data
    const dataHash = this.hashData(data);
    return `${userId}-${operation}-${dataHash}-${Date.now()}`;
  }
  
  private hashData(data: any): string {
    // Simple hash function for data
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  public async executeIdempotent(
    requestId: string,
    userId: string,
    operation: string,
    data: any,
    writeFunction: () => Promise<any>
  ): Promise<any> {
    // Check if request already exists
    const existingRequest = this.requestCache.get(requestId);
    
    if (existingRequest) {
      if (existingRequest.status === 'completed') {
        console.log(`✅ Request ${requestId} already completed, returning cached result`);
        return existingRequest.data;
      }
      
      if (existingRequest.status === 'processing') {
        console.log(`⏳ Request ${requestId} is already processing, waiting...`);
        return this.waitForCompletion(requestId);
      }
      
      if (existingRequest.status === 'failed' && existingRequest.retryCount >= this.config.maxRetries) {
        throw new Error(`Request ${requestId} failed after ${this.config.maxRetries} retries`);
      }
    }
    
    // Create or update request
    const request: WriteRequest = existingRequest || {
      requestId,
      operation,
      data,
      timestamp: Date.now(),
      userId,
      status: 'pending',
      retryCount: 0
    };
    
    request.status = 'processing';
    this.requestCache.set(requestId, request);
    this.processingRequests.add(requestId);
    
    try {
      console.log(`🔄 Executing idempotent write: ${operation} (${requestId})`);
      const result = await writeFunction();
      
      request.status = 'completed';
      request.data = result;
      this.processingRequests.delete(requestId);
      
      console.log(`✅ Idempotent write completed: ${operation} (${requestId})`);
      return result;
      
    } catch (error) {
      request.status = 'failed';
      request.retryCount++;
      this.processingRequests.delete(requestId);
      
      console.error(`❌ Idempotent write failed: ${operation} (${requestId})`, error);
      
      // Retry if under max retries
      if (request.retryCount < this.config.maxRetries) {
        console.log(`🔄 Retrying in ${this.config.retryDelay}ms (attempt ${request.retryCount + 1}/${this.config.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.executeIdempotent(requestId, userId, operation, data, writeFunction);
      }
      
      throw error;
    }
  }
  
  private async waitForCompletion(requestId: string, timeout: number = 30000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const request = this.requestCache.get(requestId);
      
      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }
      
      if (request.status === 'completed') {
        return request.data;
      }
      
      if (request.status === 'failed') {
        throw new Error(`Request ${requestId} failed`);
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Request ${requestId} timed out`);
  }
  
  public isRequestCompleted(requestId: string): boolean {
    const request = this.requestCache.get(requestId);
    return request?.status === 'completed' || false;
  }
  
  public isRequestProcessing(requestId: string): boolean {
    return this.processingRequests.has(requestId);
  }
  
  public getRequest(requestId: string): WriteRequest | undefined {
    return this.requestCache.get(requestId);
  }
  
  public cancelRequest(requestId: string): boolean {
    const request = this.requestCache.get(requestId);
    if (!request || request.status === 'completed') {
      return false;
    }
    
    this.requestCache.delete(requestId);
    this.processingRequests.delete(requestId);
    console.log(`🚫 Cancelled request: ${requestId}`);
    return true;
  }
  
  public getStats() {
    const requests = Array.from(this.requestCache.values());
    
    return {
      totalRequests: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      processing: requests.filter(r => r.status === 'processing').length,
      completed: requests.filter(r => r.status === 'completed').length,
      failed: requests.filter(r => r.status === 'failed').length,
      config: this.config
    };
  }
  
  public dispose(): void {
    this.requestCache.clear();
    this.processingRequests.clear();
  }
}
