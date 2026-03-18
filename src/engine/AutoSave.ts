/**
 * AutoSave.ts
 * Auto-Save Interval (Quick Win #4)
 * Configurable auto-save untuk editor
 */

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  maxBackups?: number;
}

export class AutoSaveManager {
  private config: AutoSaveConfig;
  private intervalId: number | null = null;
  private saveCallback: () => Promise<void>;
  private lastSaveTime: number = 0;
  private saveCount: number = 0;

  constructor(saveCallback: () => Promise<void>, config: AutoSaveConfig = {
    enabled: true,
    interval: 60000, // 1 minute
    maxBackups: 5
  }) {
    this.saveCallback = saveCallback;
    this.config = config;
    
    if (config.enabled) {
      this.start();
    }
  }

  public start(): void {
    if (this.intervalId !== null) return;
    
    this.intervalId = window.setInterval(async () => {
      await this.performAutoSave();
    }, this.config.interval);
    
    console.log(`✅ Auto-save enabled (interval: ${this.config.interval / 1000}s)`);
  }

  public stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏸️ Auto-save disabled');
    }
  }

  private async performAutoSave(): Promise<void> {
    try {
      console.log('💾 Auto-saving...');
      await this.saveCallback();
      this.lastSaveTime = Date.now();
      this.saveCount++;
      console.log(`✅ Auto-save complete (#${this.saveCount})`);
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }

  public setInterval(interval: number): void {
    this.config.interval = interval;
    if (this.intervalId !== null) {
      this.stop();
      this.start();
    }
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  public getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  public getSaveCount(): number {
    return this.saveCount;
  }

  public dispose(): void {
    this.stop();
  }
}
