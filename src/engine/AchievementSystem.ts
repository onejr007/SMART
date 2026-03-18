/**
 * AchievementSystem.ts
 * Achievement System (#35)
 * Unlock conditions dan progress tracking
 * Integration dengan Firebase untuk cloud sync
 */

import { database } from '../firebase';
import { ref, set, get, update } from 'firebase/database';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  points: number;
  hidden: boolean;
  category: string;
  requirement: {
    type: 'count' | 'boolean' | 'comparison';
    target: number | boolean;
    current?: number;
  };
}

export interface AchievementProgress {
  achievementId: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  notified: boolean;
}

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private progress: Map<string, AchievementProgress> = new Map();
  private userId: string;
  private gameId: string;
  private onAchievementUnlocked?: (achievement: Achievement) => void;

  constructor(userId: string, gameId: string) {
    this.userId = userId;
    this.gameId = gameId;
  }

  public registerAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
    
    // Initialize progress if not exists
    if (!this.progress.has(achievement.id)) {
      this.progress.set(achievement.id, {
        achievementId: achievement.id,
        unlocked: false,
        progress: 0,
        notified: false
      });
    }
  }

  public async loadProgress(): Promise<void> {
    try {
      const progressRef = ref(database, `achievements/${this.userId}/${this.gameId}`);
      const snapshot = await get(progressRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.entries(data).forEach(([id, prog]: [string, any]) => {
          this.progress.set(id, prog);
        });
      }
    } catch (error) {
      console.error('Failed to load achievement progress:', error);
    }
  }

  public async saveProgress(): Promise<void> {
    try {
      const progressRef = ref(database, `achievements/${this.userId}/${this.gameId}`);
      const data: Record<string, any> = {};
      
      this.progress.forEach((prog, id) => {
        data[id] = prog;
      });
      
      await set(progressRef, data);
    } catch (error) {
      console.error('Failed to save achievement progress:', error);
    }
  }

  public updateProgress(achievementId: string, value: number | boolean): void {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      console.warn(`Achievement ${achievementId} not found`);
      return;
    }

    const progress = this.progress.get(achievementId);
    if (!progress || progress.unlocked) {
      return; // Already unlocked
    }

    // Update progress based on type
    if (achievement.requirement.type === 'count') {
      progress.progress = typeof value === 'number' ? value : progress.progress + 1;
    } else if (achievement.requirement.type === 'boolean') {
      progress.progress = value ? 1 : 0;
    } else if (achievement.requirement.type === 'comparison') {
      progress.progress = typeof value === 'number' ? value : 0;
    }

    // Check if unlocked
    this.checkUnlock(achievementId);
  }

  public incrementProgress(achievementId: string, amount: number = 1): void {
    const progress = this.progress.get(achievementId);
    if (!progress || progress.unlocked) return;

    progress.progress += amount;
    this.checkUnlock(achievementId);
  }

  private checkUnlock(achievementId: string): void {
    const achievement = this.achievements.get(achievementId);
    const progress = this.progress.get(achievementId);
    
    if (!achievement || !progress || progress.unlocked) return;

    let shouldUnlock = false;

    if (achievement.requirement.type === 'count') {
      shouldUnlock = progress.progress >= (achievement.requirement.target as number);
    } else if (achievement.requirement.type === 'boolean') {
      shouldUnlock = progress.progress === 1;
    } else if (achievement.requirement.type === 'comparison') {
      shouldUnlock = progress.progress >= (achievement.requirement.target as number);
    }

    if (shouldUnlock) {
      this.unlockAchievement(achievementId);
    }
  }

  private unlockAchievement(achievementId: string): void {
    const achievement = this.achievements.get(achievementId);
    const progress = this.progress.get(achievementId);
    
    if (!achievement || !progress) return;

    progress.unlocked = true;
    progress.unlockedAt = Date.now();
    progress.notified = false;

    console.log(`🏆 Achievement Unlocked: ${achievement.name}`);

    if (this.onAchievementUnlocked) {
      this.onAchievementUnlocked(achievement);
    }

    // Save to cloud
    this.saveProgress();
  }

  public getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  public getProgress(id: string): AchievementProgress | undefined {
    return this.progress.get(id);
  }

  public getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getUnlockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(achievement => {
      const progress = this.progress.get(achievement.id);
      return progress?.unlocked;
    });
  }

  public getLockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(achievement => {
      const progress = this.progress.get(achievement.id);
      return !progress?.unlocked && !achievement.hidden;
    });
  }

  public getTotalPoints(): number {
    return this.getUnlockedAchievements().reduce(
      (total, achievement) => total + achievement.points,
      0
    );
  }

  public getCompletionPercentage(): number {
    const total = this.achievements.size;
    const unlocked = this.getUnlockedAchievements().length;
    return total > 0 ? (unlocked / total) * 100 : 0;
  }

  public setOnAchievementUnlocked(callback: (achievement: Achievement) => void): void {
    this.onAchievementUnlocked = callback;
  }

  public getUnnotifiedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(achievement => {
      const progress = this.progress.get(achievement.id);
      return progress?.unlocked && !progress.notified;
    });
  }

  public markAsNotified(achievementId: string): void {
    const progress = this.progress.get(achievementId);
    if (progress) {
      progress.notified = true;
    }
  }
}
