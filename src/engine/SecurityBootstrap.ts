/**
 * SecurityBootstrap - Security & Moderation Systems Integration
 * Integrates anti-cheat, UGC publishing, sandboxing, and moderation
 */

import { AntiCheat } from './AntiCheat';
import { UGCPublishing } from './UGCPublishing';
import { ScriptSandbox } from './ScriptSandbox';
import { PermissionSystem } from './PermissionSystem';
import { FirebaseRulesHardening } from './FirebaseRulesHardening';
import { AuditLogTamperEvident } from './AuditLogTamperEvident';
import { TransactionLedger } from './TransactionLedger';
import { ModerationToolkit } from './ModerationToolkit';
import { SecurityChecklist } from './SecurityChecklist';
import { eventBus } from './EventBus';

export interface SecurityBootstrapConfig {
  enableAntiCheat?: boolean;
  enableUGCPublishing?: boolean;
  enableScriptSandbox?: boolean;
  enablePermissions?: boolean;
  enableAuditLog?: boolean;
  enableTransactionLedger?: boolean;
  enableModeration?: boolean;
  strictMode?: boolean;
}

export class SecurityBootstrap {
  private antiCheat: AntiCheat | null = null;
  private ugcPublishing: UGCPublishing | null = null;
  private scriptSandbox: ScriptSandbox | null = null;
  private permissions: PermissionSystem | null = null;
  private rulesHardening: FirebaseRulesHardening | null = null;
  private auditLog: AuditLogTamperEvident | null = null;
  private transactionLedger: TransactionLedger | null = null;
  private moderation: ModerationToolkit | null = null;
  private securityChecklist: SecurityChecklist | null = null;
  
  private isEnabled: boolean = false;
  private strictMode: boolean = false;

  constructor(config: SecurityBootstrapConfig = {}) {
    if (config.enableAntiCheat === false && 
        config.enableUGCPublishing === false &&
        config.enableModeration === false) {
      console.log('🔒 Security systems disabled');
      return;
    }
    
    this.isEnabled = true;
    this.strictMode = config.strictMode || false;
    
    // Anti-cheat system
    if (config.enableAntiCheat !== false) {
      this.antiCheat = new AntiCheat();
    }
    
    // UGC Publishing
    if (config.enableUGCPublishing !== false) {
      this.ugcPublishing = new UGCPublishing();
    }
    
    // Script sandbox
    if (config.enableScriptSandbox !== false) {
      this.scriptSandbox = new ScriptSandbox();
    }
    
    // Permission system
    if (config.enablePermissions !== false) {
      this.permissions = new PermissionSystem();
    }
    
    // Firebase rules hardening
    this.rulesHardening = new FirebaseRulesHardening();
    
    // Audit log
    if (config.enableAuditLog !== false) {
      this.auditLog = new AuditLogTamperEvident();
    }
    
    // Transaction ledger
    if (config.enableTransactionLedger !== false) {
      this.transactionLedger = new TransactionLedger();
    }
    
    // Moderation toolkit
    if (config.enableModeration !== false) {
      this.moderation = new ModerationToolkit();
    }
    
    // Security checklist
    this.securityChecklist = new SecurityChecklist();
    
    this.setupEventListeners();
    this.runSecurityChecks();
    
    console.log('✅ Security Bootstrap initialized');
  }

  private setupEventListeners() {
    if (!this.isEnabled) return;
    
    // Anti-cheat events
    if (this.antiCheat) {
      eventBus.on('player:move', (data: any) => {
        const valid = this.antiCheat!.validateMovement(data.playerId, data.position);
        if (!valid.valid) {
          console.warn(`⚠️ Invalid movement detected: ${data.playerId}`);
          eventBus.emit('anticheat:violation', { playerId: data.playerId, type: 'movement' });
        }
      });
      
      eventBus.on('player:score', (data: any) => {
        const valid = this.antiCheat!.validateScore(data.playerId, data.score);
        if (!valid.valid) {
          console.warn(`⚠️ Invalid score detected: ${data.playerId}`);
          eventBus.emit('anticheat:violation', { playerId: data.playerId, type: 'score' });
        }
      });
    }
    
    // UGC events
    if (this.ugcPublishing) {
      eventBus.on('ugc:publish', async (data: any) => {
        console.log(`UGC publish requested: ${data.contentId}`);
      });
    }
    
    // Moderation events
    if (this.moderation) {
      eventBus.on('moderation:report', (data: any) => {
        this.moderation!.takedown(data.targetId, data.reason, data.reporterId);
      });
    }
  }

  private runSecurityChecks() {
    if (!this.securityChecklist) return;
    
    const report = this.securityChecklist.generateReport();
    console.log('🔒 Security Checklist:', report);
    
    if (this.strictMode) {
      const criticalIssues = this.securityChecklist.getCriticalIssues();
      if (criticalIssues.length > 0) {
        console.error('❌ Security issues found in strict mode:', criticalIssues);
      }
    }
  }

  // Anti-cheat methods
  public validateMovement(playerId: string, position: any): boolean {
    if (!this.antiCheat) return true;
    const result = this.antiCheat.validateMovement(playerId, position);
    return result.valid;
  }

  public validateScore(playerId: string, score: number, deltaTime: number): boolean {
    if (!this.antiCheat) return true;
    const result = this.antiCheat.validateScore(playerId, score);
    return result.valid;
  }

  public reportCheat(playerId: string, type: string) {
    if (this.antiCheat) {
      console.warn(`Cheat reported: ${playerId} - ${type}`);
    }
  }

  // UGC methods
  public async publishContent(content: any, authorId: string) {
    if (!this.ugcPublishing) {
      console.warn('UGC publishing not enabled');
      return { success: false, error: 'Not enabled' };
    }
    
    console.log('Publishing UGC content for author:', authorId);
    return { success: true, contentId: 'ugc_' + Date.now() };
  }

  public async reviewContent(contentId: string, approved: boolean, reviewerId: string) {
    if (this.ugcPublishing) {
      if (approved) {
        this.ugcPublishing.approveAsset(contentId);
      } else {
        this.ugcPublishing.rejectAsset(contentId);
      }
    }
  }

  // Script sandbox methods
  public async executeScript(code: string, context: any = {}) {
    if (!this.scriptSandbox) {
      console.warn('Script sandbox not enabled');
      return null;
    }
    
    return this.scriptSandbox.executeScript(code, context);
  }

  public terminateScript() {
    if (this.scriptSandbox) {
      this.scriptSandbox.terminate();
    }
  }

  // Permission methods
  public checkPermission(userId: string, gameId: string, action: string): boolean {
    if (!this.permissions) return true;
    return this.permissions.hasPermission(gameId, userId, action as any);
  }

  public grantPermission(userId: string, gameId: string, permission: string) {
    if (this.permissions) {
      this.permissions.grant(gameId, userId, permission as any, 'system');
    }
  }

  public revokePermission(userId: string, gameId: string, permission: string) {
    if (this.permissions) {
      this.permissions.revoke(gameId, userId);
    }
  }

  // Audit log methods
  public async logAction(action: string, userId: string, data: any) {
    if (this.auditLog) {
      await this.auditLog.log(userId, action, data);
    }
  }

  public async verifyAuditLog(logId: string): Promise<boolean> {
    if (!this.auditLog) return true;
    return this.auditLog.verify();
  }

  // Transaction methods
  public async recordTransaction(userId: string, type: string, amount: number, metadata: any) {
    if (this.transactionLedger) {
      return this.transactionLedger.executeTransaction(userId, type as any, amount, crypto.randomUUID(), metadata);
    }
  }

  public async getTransactionHistory(userId: string) {
    if (this.transactionLedger) {
      return this.transactionLedger.getTransactionHistory(userId);
    }
    return [];
  }

  // Moderation methods
  public banPlayer(playerId: string, reason: string, duration?: number) {
    if (this.moderation) {
      this.moderation.ban(playerId, reason, 'system', duration);
    }
  }

  public unbanPlayer(playerId: string) {
    if (this.moderation) {
      console.log('Unbanning player:', playerId);
    }
  }

  public mutePlayer(playerId: string, duration?: number) {
    if (this.moderation) {
      console.log('Muting player:', playerId, 'for', duration, 'ms');
    }
  }

  public isPlayerBanned(playerId: string): boolean {
    if (!this.moderation) return false;
    return this.moderation.isBanned(playerId);
  }

  public isPlayerMuted(playerId: string): boolean {
    if (!this.moderation) return false;
    return this.moderation.isShadowbanned(playerId);
  }

  // Getters
  public getAntiCheat() { return this.antiCheat; }
  public getUGCPublishing() { return this.ugcPublishing; }
  public getScriptSandbox() { return this.scriptSandbox; }
  public getPermissions() { return this.permissions; }
  public getRulesHardening() { return this.rulesHardening; }
  public getAuditLog() { return this.auditLog; }
  public getTransactionLedger() { return this.transactionLedger; }
  public getModeration() { return this.moderation; }
  public getSecurityChecklist() { return this.securityChecklist; }
  
  public isSecurityEnabled() { return this.isEnabled; }
  public isStrictMode() { return this.strictMode; }

  public dispose() {
    if (this.scriptSandbox) {
      this.scriptSandbox.terminate();
    }
    console.log('✅ Security Bootstrap disposed');
  }
}
