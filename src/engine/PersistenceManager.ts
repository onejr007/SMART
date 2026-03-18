import { SceneManager } from './SceneManager';
import { eventBus } from './EventBus';
import { auditManager } from './AuditManager';
import { database, auth } from '../firebase';
import { ref, push, set, get, query, orderByChild } from 'firebase/database';

export class PersistenceManager {
    private static instance: PersistenceManager;

    private constructor() {}

    public static getInstance(): PersistenceManager {
        if (!PersistenceManager.instance) {
            PersistenceManager.instance = new PersistenceManager();
        }
        return PersistenceManager.instance;
    }

    private getCurrentUser() {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }
        return user;
    }

    public async saveGame(title: string, sceneManager: SceneManager, playerSchema?: any) {
        try {
            const user = this.getCurrentUser();
            
            // Create game data
            const gameData = {
                title,
                description: 'A user generated world built in SMART Engine',
                author: user.displayName || 'Anonymous',
                authorId: user.uid,
                createdAt: new Date().toISOString(),
                version: '2.1',
                scene: sceneManager.toJSON(),
                playerSchema: playerSchema || { level: 1, coins: 0 }
            };

            // Save to Firebase Realtime Database
            const gamesRef = ref(database, 'games');
            const newGameRef = push(gamesRef);
            await set(newGameRef, gameData);
            
            const gameId = newGameRef.key!;
            
            await auditManager.log('GAME_SAVE', user.uid, { gameId, title, schema: playerSchema });
            eventBus.emit('db:saved', { id: gameId, title });
            return gameId;
        } catch (error: any) {
            console.error("Database Save Error:", error);
            const userId = auth.currentUser?.uid || 'unknown';
            await auditManager.log('GAME_SAVE_FAILED', userId, { title, error: error.message }, 'failure');
            eventBus.emit('db:error', { operation: 'save', error });
            throw error;
        }
    }

    /**
     * Menyimpan progres pemain spesifik untuk sebuah game tertentu.
     */
    public async saveUserProgress(userId: string, gameId: string, progressData: any) {
        try {
            const user = this.getCurrentUser();
            if (user.uid !== userId) {
                throw new Error('Invalid userId for saveUserProgress');
            }
            
            const progressRef = ref(database, `user_game_data/${userId}/${gameId}`);
            await set(progressRef, {
                ...progressData,
                lastUpdated: new Date().toISOString()
            });
            
            eventBus.emit('db:progress-saved', { userId, gameId });
        } catch (error: any) {
            console.error("Progress Save Error:", error);
            eventBus.emit('db:error', { operation: 'save-progress', error });
            throw error;
        }
    }

    /**
     * Memuat progres pemain untuk game tertentu.
     * Jika belum ada data, akan menggunakan default schema dari game tersebut.
     */
    public async loadUserProgress(userId: string, gameId: string): Promise<any> {
        try {
            const user = this.getCurrentUser();
            if (user.uid !== userId) {
                throw new Error('Invalid userId for loadUserProgress');
            }
            
            const progressRef = ref(database, `user_game_data/${userId}/${gameId}`);
            const snapshot = await get(progressRef);
            
            if (snapshot.exists()) {
                return snapshot.val();
            }

            // Jika tidak ada progres, ambil default schema dari game
            try {
                const gameData = await this.loadGame(gameId, { silent: true });
                return gameData.playerSchema || {};
            } catch {
                return {};
            }
        } catch (error) {
            console.error("Progress Load Error:", error);
            throw error;
        }
    }

    public async loadGame(gameId: string, options?: { silent?: boolean }): Promise<any> {
        try {
            const gameRef = ref(database, `games/${gameId}`);
            const snapshot = await get(gameRef);
            
            if (!snapshot.exists()) {
                throw new Error('Game not found');
            }
            
            const data = { id: gameId, ...snapshot.val() };
            
            if (data.isDeleted) {
                throw new Error('Game not found');
            }
            
            eventBus.emit('db:loaded', { id: gameId, data });
            return data;
        } catch (error) {
            if (!options?.silent) {
                console.error("Database Load Error:", error);
                eventBus.emit('db:error', { operation: 'load', error });
            }
            throw error;
        }
    }

    public async listGames(): Promise<any[]> {
        try {
            const gamesRef = ref(database, 'games');
            const snapshot = await get(gamesRef);
            
            if (!snapshot.exists()) {
                return [];
            }
            
            const gamesData = snapshot.val();
            const games = Object.keys(gamesData)
                .map(id => ({ id, ...gamesData[id] }))
                .filter(game => !game.isDeleted)
                .sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });
            
            return games;
        } catch (error) {
            console.error("Database List Error:", error);
            return [];
        }
    }
}

export const persistence = PersistenceManager.getInstance();
