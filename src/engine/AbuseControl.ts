/**
 * Abuse Control System (Rekomendasi #48)
 * Rate limiting, mute/ban, report system
 */

import { eventBus } from './EventBus';

export interface RateLimitConfig {
  maxMessages: number;
  windowMs: number;
}

export interface PlayerReport {
  reporterId: string;
  reportedId: string;
  reason: string;
  timestamp: number;
  evidence?: string;
}

export interface ModerationAction {
  playerId: string;
  action: 'mute' | 'ban' | 'warn';
  reason: string;
  duration?: number; // milliseconds
  expiresAt?: number;
  moderatorId: string;
}

export class AbuseControl {
  private messageHistory: Map<string, number[]> = new Map();
  private mutedPlayers: Map<string, number> = new Map(); // playerId -> expiresAt
  private bannedPlayers: Map<string, number> = new Map(); // playerId -> expiresAt
  private reports: PlayerReport[] = [];
  private rateLimitConfig: RateLimitConfig;
  
  constructor(config?: Partial<RateLimitConfig>) {
    this.rateLimitConfig = {
      maxMessages: 5,
      windowMs: 10000, // 10 seconds
      ...config,
    };
    
    // Cleanup expired actions every minute
    setInterval(() => this.cleanupExpired(), 60000);
  }
  
  /**
   * Rate Limiting
   */
  public checkRateLimit(playerId: string): boolean {
    const now = Date.now();
    const history = this.messageHistory.get(playerId) || [];
    
    // Remove old messages outside window
    const recentMessages = history.filter(
      timestamp => now - timestamp < this.rateLimitConfig.windowMs
    );
    
    if (recentMessages.length >= this.rateLimitConfig.maxMessages) {
      eventBus.emit('abuse:rate-limit-exceeded', { playerId });
      return false;
    }
    
    recentMessages.push(now);
    this.messageHistory.set(playerId, recentMessages);
    return true;
  }
  
  /**
   * Mute System
   */
  public mutePlayer(action: ModerationAction): void {
    const expiresAt = action.duration 
      ? Date.now() + action.duration 
      : Date.now() + (24 * 60 * 60 * 1000); // Default 24 hours
    
    this.mutedPlayers.set(action.playerId, expiresAt);
    
    eventBus.emit('abuse:player-muted', {
      playerId: action.playerId,
      reason: action.reason,
      expiresAt,
    });
    
    console.log(`Player ${action.playerId} muted until ${new Date(expiresAt)}`);
  }
  
  public unmutePlayer(playerId: string): void {
    this.mutedPlayers.delete(playerId);
    eventBus.emit('abuse:player-unmuted', { playerId });
  }
  
  public isMuted(playerId: string): boolean {
    const expiresAt = this.mutedPlayers.get(playerId);
    if (!expiresAt) return false;
    
    if (Date.now() > expiresAt) {
      this.mutedPlayers.delete(playerId);
      return false;
    }
    
    return true;
  }
  
  /**
   * Ban System
   */
  public banPlayer(action: ModerationAction): void {
    const expiresAt = action.duration 
      ? Date.now() + action.duration 
      : Infinity; // Permanent ban
    
    this.bannedPlayers.set(action.playerId, expiresAt);
    
    eventBus.emit('abuse:player-banned', {
      playerId: action.playerId,
      reason: action.reason,
      expiresAt,
      permanent: expiresAt === Infinity,
    });
    
    console.log(`Player ${action.playerId} banned`);
  }
  
  public unbanPlayer(playerId: string): void {
    this.bannedPlayers.delete(playerId);
    eventBus.emit('abuse:player-unbanned', { playerId });
  }
  
  public isBanned(playerId: string): boolean {
    const expiresAt = this.bannedPlayers.get(playerId);
    if (!expiresAt) return false;
    
    if (expiresAt === Infinity) return true;
    
    if (Date.now() > expiresAt) {
      this.bannedPlayers.delete(playerId);
      return false;
    }
    
    return true;
  }
  
  /**
   * Report System
   */
  public reportPlayer(report: PlayerReport): void {
    this.reports.push(report);
    
    eventBus.emit('abuse:player-reported', report);
    
    // Auto-action if multiple reports
    const recentReports = this.reports.filter(
      r => r.reportedId === report.reportedId && 
           Date.now() - r.timestamp < 3600000 // Last hour
    );
    
    if (recentReports.length >= 3) {
      // Auto-mute after 3 reports
      this.mutePlayer({
        playerId: report.reportedId,
        action: 'mute',
        reason: 'Multiple reports',
        duration: 3600000, // 1 hour
        moderatorId: 'system',
      });
    }
  }
  
  public getReports(playerId?: string): PlayerReport[] {
    if (playerId) {
      return this.reports.filter(r => r.reportedId === playerId);
    }
    return [...this.reports];
  }
  
  /**
   * Message Filtering
   */
  public filterMessage(message: string, playerId: string): { allowed: boolean; filtered: string } {
    // Check if player is muted
    if (this.isMuted(playerId)) {
      return { allowed: false, filtered: '' };
    }
    
    // Check rate limit
    if (!this.checkRateLimit(playerId)) {
      return { allowed: false, filtered: '' };
    }
    
    // Basic profanity filter (expand as needed)
    const profanityList = ['badword1', 'badword2']; // Add actual words
    let filtered = message;
    
    profanityList.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '***');
    });
    
    return { allowed: true, filtered };
  }
  
  /**
   * Cleanup
   */
  private cleanupExpired(): void {
    const now = Date.now();
    
    // Cleanup mutes
    for (const [playerId, expiresAt] of this.mutedPlayers.entries()) {
      if (now > expiresAt) {
        this.mutedPlayers.delete(playerId);
      }
    }
    
    // Cleanup bans
    for (const [playerId, expiresAt] of this.bannedPlayers.entries()) {
      if (expiresAt !== Infinity && now > expiresAt) {
        this.bannedPlayers.delete(playerId);
      }
    }
    
    // Cleanup old reports (keep last 7 days)
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    this.reports = this.reports.filter(r => r.timestamp > sevenDaysAgo);
  }
  
  /**
   * Stats
   */
  public getStats() {
    return {
      mutedPlayers: this.mutedPlayers.size,
      bannedPlayers: this.bannedPlayers.size,
      totalReports: this.reports.length,
      recentReports: this.reports.filter(
        r => Date.now() - r.timestamp < 3600000
      ).length,
    };
  }
  
  public clear(): void {
    this.messageHistory.clear();
    this.mutedPlayers.clear();
    this.bannedPlayers.clear();
    this.reports = [];
  }
}

export const abuseControl = new AbuseControl();
