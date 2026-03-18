/**
 * WriteThrottling.ts
 * [P0] Write throttling & quotas
 * Batasi write per user untuk menghindari abuse & biaya meledak
 */

export interface ThrottleConfig {
  maxWritesPerMinute: number;
  maxWritesPerHour: number;
  maxWritesPerDay: number;
  maxPayloadSizeKB: number;
  enableBurst: boolean;
  burstSize: number;
}

export const DEFAULT_THROTTLE_CONFIG: ThrottleConfig = {
  maxWritesPerMinute: 10,
  maxWritesPerHour: 100,
  maxWritesPerDay: 1000,
  maxPayloadSizeKB: 1024, // 1MB
  enableBurst: true,
  burstSize: 5
};

interface WriteRecord {
  timestamp: number;
  size: number;
  userId: string;
  operation: string;
}

interface UserQuota {
  userId: string;
  writes: WriteRecord[];
  totalBytesWritten: number;
  lastResetTime: number;
}

export class WriteThrottlingManager {
  private config: ThrottleConfig;
  private userQuotas: Map<string, UserQuota> = new Map();
  private globalWriteCount: number = 0;
  
  constructor(config: ThrottleConfig = DEFAULT_THROTTLE_CONFIG) {
    this.config = { ...config };
    this.startCleanupTimer();
  }
  
  private startCleanupTimer(): void {
    // Clean up old records every minute
    setInterval(() => {
      this.cleanupOldRecords();
    }, 60000);
  }
  
  private cleanupOldRecords(): void {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    
    for (const quota of this.userQuotas.values()) {
      quota.writes = quota.writes.filter(w => w.timestamp > dayAgo);
    }
  }
  
  private getOrCreateQuota(userId: string): UserQuota {
    if (!this.userQuotas.has(userId)) {
      this.userQuotas.set(userId, {
        userId,
        writes: [],
        totalBytesWritten: 0,
        lastResetTime: Date.now()
      });
    }
    return this.userQuotas.get(userId)!;
  }
  
  public canWrite(userId: string, payloadSizeKB: number, operation: string = 'write'): { allowed: boolean; reason?: string } {
    // Check payload size
    if (payloadSizeKB > this.config.maxPayloadSizeKB) {
      return {
        allowed: false,
        reason: `Payload size ${payloadSizeKB}KB exceeds limit of ${this.config.maxPayloadSizeKB}KB`
      };
    }
    
    const quota = this.getOrCreateQuota(userId);
    const now = Date.now();
    
    // Count writes in different time windows
    const minuteAgo = now - 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;
    
    const writesLastMinute = quota.writes.filter(w => w.timestamp > minuteAgo).length;
    const writesLastHour = quota.writes.filter(w => w.timestamp > hourAgo).length;
    const writesLastDay = quota.writes.filter(w => w.timestamp > dayAgo).length;
    
    // Check burst allowance
    if (this.config.enableBurst && writesLastMinute === 0) {
      // Allow burst at the start of a new minute
      return { allowed: true };
    }
    
    // Check per-minute limit
    if (writesLastMinute >= this.config.maxWritesPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${writesLastMinute}/${this.config.maxWritesPerMinute} writes per minute`
      };
    }
    
    // Check per-hour limit
    if (writesLastHour >= this.config.maxWritesPerHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${writesLastHour}/${this.config.maxWritesPerHour} writes per hour`
      };
    }
    
    // Check per-day limit
    if (writesLastDay >= this.config.maxWritesPerDay) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${writesLastDay}/${this.config.maxWritesPerDay} writes per day`
      };
    }
    
    return { allowed: true };
  }
  
  public recordWrite(userId: string, payloadSizeKB: number, operation: string = 'write'): void {
    const quota = this.getOrCreateQuota(userId);
    
    const record: WriteRecord = {
      timestamp: Date.now(),
      size: payloadSizeKB,
      userId,
      operation
    };
    
    quota.writes.push(record);
    quota.totalBytesWritten += payloadSizeKB;
    this.globalWriteCount++;
    
    console.log(`📝 Write recorded for ${userId}: ${payloadSizeKB}KB (${operation})`);
  }
  
  public async throttledWrite(
    userId: string,
    payloadSizeKB: number,
    writeFunction: () => Promise<any>,
    operation: string = 'write'
  ): Promise<any> {
    const check = this.canWrite(userId, payloadSizeKB, operation);
    
    if (!check.allowed) {
      throw new Error(`Write throttled: ${check.reason}`);
    }
    
    try {
      const result = await writeFunction();
      this.recordWrite(userId, payloadSizeKB, operation);
      return result;
    } catch (error) {
      console.error(`❌ Write failed for ${userId}:`, error);
      throw error;
    }
  }
  
  public getUserQuota(userId: string): {
    writesLastMinute: number;
    writesLastHour: number;
    writesLastDay: number;
    totalBytesWritten: number;
    remainingMinute: number;
    remainingHour: number;
    remainingDay: number;
  } {
    const quota = this.getOrCreateQuota(userId);
    const now = Date.now();
    
    const minuteAgo = now - 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;
    
    const writesLastMinute = quota.writes.filter(w => w.timestamp > minuteAgo).length;
    const writesLastHour = quota.writes.filter(w => w.timestamp > hourAgo).length;
    const writesLastDay = quota.writes.filter(w => w.timestamp > dayAgo).length;
    
    return {
      writesLastMinute,
      writesLastHour,
      writesLastDay,
      totalBytesWritten: quota.totalBytesWritten,
      remainingMinute: Math.max(0, this.config.maxWritesPerMinute - writesLastMinute),
      remainingHour: Math.max(0, this.config.maxWritesPerHour - writesLastHour),
      remainingDay: Math.max(0, this.config.maxWritesPerDay - writesLastDay)
    };
  }
  
  public resetUserQuota(userId: string): void {
    this.userQuotas.delete(userId);
    console.log(`🔄 Quota reset for user ${userId}`);
  }
  
  public getStats() {
    return {
      totalUsers: this.userQuotas.size,
      globalWriteCount: this.globalWriteCount,
      config: this.config,
      topUsers: this.getTopUsers(5)
    };
  }
  
  private getTopUsers(limit: number): Array<{ userId: string; writes: number }> {
    const users = Array.from(this.userQuotas.values())
      .map(q => ({ userId: q.userId, writes: q.writes.length }))
      .sort((a, b) => b.writes - a.writes)
      .slice(0, limit);
    
    return users;
  }
  
  public dispose(): void {
    this.userQuotas.clear();
  }
}
