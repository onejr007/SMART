import { database } from '../firebase';
import { ref, set, get, push, child, runTransaction } from 'firebase/database';
import { SceneManager } from './SceneManager';
import { eventBus } from './EventBus';
import { auditManager } from './AuditManager';
import logger from '../../utils/logger.js';

export class PersistenceManager {
    private static instance: PersistenceManager;

    private constructor() {}

    public static getInstance(): PersistenceManager {
        if (!PersistenceManager.instance) {
            PersistenceManager.instance = new PersistenceManager();
        }
        return PersistenceManager.instance;
    }

    /**
     * Soft delete an item by setting isDeleted: true.
     * @recommendation Database #15 - Soft Deletes
     */
    public async softDelete(path: string) {
        try {
            const dbRef = ref(database, path);
            await set(dbRef, { 
                isDeleted: true, 
                deletedAt: new Date().toISOString() 
            });
            logger.info(`Soft deleted item at ${path}`);
        } catch (error: any) {
            logger.error(`Soft delete failed at ${path}:`, error);
            throw error;
        }
    }

    /**
     * Menjalankan operasi atomik pada database (Transaction).
     * @recommendation Database #11 - Atomic Operations
     */
    public async performTransaction(path: string, updateFn: (currentData: any) => any) {
        const dbRef = ref(database, path);
        try {
            const result = await runTransaction(dbRef, updateFn);
            return result;
        } catch (error: any) {
            logger.error(`Transaction failed at ${path}:`, error);
            throw error;
        }
    }

    public async saveGame(userId: string, title: string, sceneManager: SceneManager, playerSchema?: any) {
        const gameData = {
            title,
            author: userId,
            createdAt: new Date().toISOString(),
            version: "2.1",
            scene: sceneManager.toJSON(),
            playerSchema: playerSchema || { level: 1, coins: 0 } // Default schema if not provided
        };

        try {
            const gamesRef = ref(database, 'games');
            const newGameRef = push(gamesRef);
            await set(newGameRef, gameData);
            
            await auditManager.log('GAME_SAVE', userId, { gameId: newGameRef.key, title, schema: playerSchema });
            eventBus.emit('db:saved', { id: newGameRef.key, title });
            return newGameRef.key;
        } catch (error: any) {
            console.error("Database Save Error:", error);
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
            const progressRef = ref(database, `user_game_data/${userId}/${gameId}`);
            const snapshot = await get(progressRef);
            
            if (snapshot.exists()) {
                return snapshot.val();
            }

            // Jika tidak ada progres, ambil default schema dari game
            const gameData = await this.loadGame(gameId);
            return gameData.playerSchema || {};
        } catch (error) {
            console.error("Progress Load Error:", error);
            throw error;
        }
    }

    public async loadGame(gameId: string): Promise<any> {
        try {
            const gameRef = ref(database, `games/${gameId}`);
            const snapshot = await get(gameRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                eventBus.emit('db:loaded', { id: gameId, data });
                return data;
            } else {
                throw new Error("Game not found");
            }
        } catch (error) {
            console.error("Database Load Error:", error);
            eventBus.emit('db:error', { operation: 'load', error });
            throw error;
        }
    }

    public async listGames(): Promise<any[]> {
        try {
            const gamesRef = ref(database, 'games');
            const snapshot = await get(gamesRef);
            
            if (snapshot.exists()) {
                const games = snapshot.val();
                return Object.keys(games).map(key => ({
                    id: key,
                    ...games[key]
                }));
            }
            return [];
        } catch (error) {
            console.error("Database List Error:", error);
            return [];
        }
    }
}

export const persistence = PersistenceManager.getInstance();
