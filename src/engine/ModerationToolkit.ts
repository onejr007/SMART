// 37. Toolkit moderasi konten
export interface ModerationAction {
  id: string;
  type: 'takedown' | 'ban' | 'shadowban' | 'warn';
  targetId: string;
  targetType: 'user' | 'content';
  reason: string;
  moderatorId: string;
  timestamp: number;
  expiresAt?: number;
  appealable: boolean;
}

export interface Appeal {
  id: string;
  actionId: string;
  userId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export class ModerationToolkit {
  private actions = new Map<string, ModerationAction>();
  private appeals = new Map<string, Appeal>();
  private bannedUsers = new Set<string>();
  private shadowbannedUsers = new Set<string>();

  takedown(contentId: string, reason: string, moderatorId: string): string {
    const action: ModerationAction = {
      id: crypto.randomUUID(),
      type: 'takedown',
      targetId: contentId,
      targetType: 'content',
      reason,
      moderatorId,
      timestamp: Date.now(),
      appealable: true
    };

    this.actions.set(action.id, action);
    return action.id;
  }

  ban(userId: string, reason: string, moderatorId: string, duration?: number): string {
    const action: ModerationAction = {
      id: crypto.randomUUID(),
      type: 'ban',
      targetId: userId,
      targetType: 'user',
      reason,
      moderatorId,
      timestamp: Date.now(),
      expiresAt: duration ? Date.now() + duration : undefined,
      appealable: true
    };

    this.actions.set(action.id, action);
    this.bannedUsers.add(userId);
    return action.id;
  }

  shadowban(userId: string, reason: string, moderatorId: string): string {
    const action: ModerationAction = {
      id: crypto.randomUUID(),
      type: 'shadowban',
      targetId: userId,
      targetType: 'user',
      reason,
      moderatorId,
      timestamp: Date.now(),
      appealable: false
    };

    this.actions.set(action.id, action);
    this.shadowbannedUsers.add(userId);
    return action.id;
  }

  isBanned(userId: string): boolean {
    return this.bannedUsers.has(userId);
  }

  isShadowbanned(userId: string): boolean {
    return this.shadowbannedUsers.has(userId);
  }

  submitAppeal(actionId: string, userId: string, reason: string): string {
    const action = this.actions.get(actionId);
    if (!action || !action.appealable) {
      throw new Error('Action not appealable');
    }

    const appeal: Appeal = {
      id: crypto.randomUUID(),
      actionId,
      userId,
      reason,
      status: 'pending',
      timestamp: Date.now()
    };

    this.appeals.set(appeal.id, appeal);
    return appeal.id;
  }

  reviewAppeal(appealId: string, approved: boolean): void {
    const appeal = this.appeals.get(appealId);
    if (!appeal) return;

    appeal.status = approved ? 'approved' : 'rejected';

    if (approved) {
      const action = this.actions.get(appeal.actionId);
      if (action) {
        if (action.type === 'ban') {
          this.bannedUsers.delete(action.targetId);
        } else if (action.type === 'shadowban') {
          this.shadowbannedUsers.delete(action.targetId);
        }
      }
    }
  }

  getActions(userId?: string): ModerationAction[] {
    const actions = Array.from(this.actions.values());
    return userId ? actions.filter(a => a.targetId === userId) : actions;
  }

  getPendingAppeals(): Appeal[] {
    return Array.from(this.appeals.values()).filter(a => a.status === 'pending');
  }
}
