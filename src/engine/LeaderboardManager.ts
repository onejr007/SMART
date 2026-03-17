import { eventBus } from './EventBus';
import { database, auth } from '../firebase';
import { ref, set, get, query, orderByChild, limitToLast } from 'firebase/database';

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
            const user = auth.currentUser;
            if (!user) {
                console.warn('Cannot submit score: user not authenticated');
                return;
            }

            // Check if user already has a score
            const userScoreRef = ref(database, `leaderboards/${gameId}/${user.uid}`);
            const snapshot = await get(userScoreRef);
            
            if (snapshot.exists()) {
                const existingScore = snapshot.val().score;
                if (existingScore >= score) {
                    // Don't update if existing score is higher
                    return;
                }
            }

            // Save new score
            const entry: LeaderboardEntry = {
                userId: user.uid,
                score,
                timestamp: new Date().toISOString()
            };

            await set(userScoreRef, entry);
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
            const leaderboardRef = ref(database, `leaderboards/${gameId}`);
            const snapshot = await get(leaderboardRef);
            
            if (!snapshot.exists()) {
                return [];
            }

            const data = snapshot.val();
            const entries: LeaderboardEntry[] = Object.values(data)
                .filter((entry: any) => entry && typeof entry.score === 'number')
                .sort((a: any, b: any) => b.score - a.score)
                .slice(0, limit);

            return entries;
        } catch (error) {
            console.error("Leaderboard Fetch Error:", error);
            return [];
        }
    }
}

export const leaderboards = LeaderboardManager.getInstance();
