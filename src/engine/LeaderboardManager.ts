import { database } from '../firebase';
import { ref, set, get, query, orderByChild, limitToLast } from 'firebase/database';
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
            const scoreRef = ref(database, `leaderboards/${gameId}/${userId}`);
            
            // Cek skor lama jika ada
            const snapshot = await get(scoreRef);
            if (snapshot.exists() && snapshot.val().score >= score) {
                return; // Jangan update jika skor baru lebih rendah
            }

            const entry: LeaderboardEntry = {
                userId,
                score,
                timestamp: new Date().toISOString()
            };

            await set(scoreRef, entry);
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
            const lbRef = ref(database, `leaderboards/${gameId}`);
            const lbQuery = query(lbRef, orderByChild('score'), limitToLast(limit));
            
            const snapshot = await get(lbQuery);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const entries = Object.values(data) as LeaderboardEntry[];
                // Firebase limitToLast mengembalikan urutan menaik, balikkan untuk tertinggi di atas
                return entries.sort((a, b) => b.score - a.score);
            }
            return [];
        } catch (error) {
            console.error("Leaderboard Fetch Error:", error);
            return [];
        }
    }
}

export const leaderboards = LeaderboardManager.getInstance();
