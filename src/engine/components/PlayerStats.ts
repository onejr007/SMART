import { Component } from '../Component';
import { persistence } from '../PersistenceManager';
import { leaderboards } from '../LeaderboardManager';
import { eventBus } from '../EventBus';

export class PlayerStats extends Component {
    private stats: Record<string, any> = {};
    private userId: string;
    private gameId: string;
    private isDirty: boolean = false;
    private autoSaveInterval: number = 30000; // 30 seconds
    private lastSaveTime: number = 0;

    constructor(userId: string, gameId: string) {
        super('PlayerStats');
        this.userId = userId;
        this.gameId = gameId;
    }

    public async onAttach() {
        // Load stats on attach
        try {
            this.stats = await persistence.loadUserProgress(this.userId, this.gameId);
            eventBus.emit('stats:loaded', this.stats);
        } catch (error) {
            console.error("Failed to load player stats:", error);
        }
    }

    public getStat(key: string, defaultValue: any = null): any {
        return this.stats[key] !== undefined ? this.stats[key] : defaultValue;
    }

    public setStat(key: string, value: any) {
        if (this.stats[key] === value) return;
        this.stats[key] = value;
        this.isDirty = true;
        eventBus.emit('stats:changed', { key, value, allStats: this.stats });
    }

    public async save() {
        if (!this.isDirty) return;
        
        try {
            await persistence.saveUserProgress(this.userId, this.gameId, this.stats);
            
            // Otomatis submit ke leaderboard jika ada stat 'score'
            if (this.stats.score !== undefined) {
                await leaderboards.submitScore(this.gameId, this.userId, this.stats.score);
            }

            this.isDirty = false;
            this.lastSaveTime = performance.now();
            console.log(`[PlayerStats] Stats & Leaderboard updated for user ${this.userId}`);
        } catch (error) {
            console.error("Failed to auto-save player stats:", error);
        }
    }

    public update(delta: number): void {
        const now = performance.now();
        // Auto-save logic
        if (this.isDirty && (now - this.lastSaveTime > this.autoSaveInterval)) {
            this.save();
        }
    }
}
