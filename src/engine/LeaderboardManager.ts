import { eventBus } from './EventBus';

export interface LeaderboardEntry {
    userId: string;
    score: number;
    timestamp: string;
}

export class LeaderboardManager {
    private static instance: LeaderboardManager;

    private constructor() {}

    public static getInstance(): LeaderboardManager {
        if (!LeaderboardManager.instance) {
            LeaderboardManager.instance = new LeaderboardManager();
        }
        return LeaderboardManager.instance;
    }

    /**
     * Submit skor pemain untuk sebuah game tertentu.
     */
    public async submitScore(gameId: string, userId: string, score: number) {
        try {
            await fetch(`/api/v1/portal/leaderboards/${encodeURIComponent(gameId)}/submit`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score })
            });
            eventBus.emit('leaderboard:submitted', { gameId, userId, score });
        } catch (error) {
            console.error("Leaderboard Submit Error:", error);
        }
    }

    /**
     * Mengambil daftar skor tertinggi (Top 10) untuk sebuah game.
     */
    public async getTopScores(gameId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
        try {
            const res = await fetch(`/api/v1/portal/leaderboards/${encodeURIComponent(gameId)}?limit=${encodeURIComponent(String(limit))}`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await res.json().catch(() => []);
            if (!res.ok) return [];
            return data as LeaderboardEntry[];
        } catch (error) {
            console.error("Leaderboard Fetch Error:", error);
            return [];
        }
    }
}

export const leaderboards = LeaderboardManager.getInstance();
