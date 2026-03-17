import { SceneManager } from './SceneManager';
import { eventBus } from './EventBus';
import { auditManager } from './AuditManager';

export class PersistenceManager {
    private static instance: PersistenceManager;

    private constructor() {}

    public static getInstance(): PersistenceManager {
        if (!PersistenceManager.instance) {
            PersistenceManager.instance = new PersistenceManager();
        }
        return PersistenceManager.instance;
    }

    private async jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
        const res = await fetch(url, {
            credentials: 'include',
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...(init?.headers || {})
            }
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            const message = (data as any)?.error || `Request failed (${res.status})`;
            throw new Error(message);
        }
        return data as T;
    }

    public async saveGame(userId: string, title: string, sceneManager: SceneManager, playerSchema?: any) {
        try {
            const payload = await this.jsonRequest<{ id: string }>('/api/v1/portal/games', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    scene: sceneManager.toJSON(),
                    playerSchema
                })
            });
            
            await auditManager.log('GAME_SAVE', userId, { gameId: payload.id, title, schema: playerSchema });
            eventBus.emit('db:saved', { id: payload.id, title });
            return payload.id;
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
            await this.jsonRequest('/api/v1/portal/user_game_data/' + encodeURIComponent(gameId), {
                method: 'PUT',
                body: JSON.stringify({ progressData })
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
            const progress = await this.jsonRequest<any>('/api/v1/portal/user_game_data/' + encodeURIComponent(gameId), {
                method: 'GET'
            }).catch(() => null);

            if (progress) return progress;

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
            const data = await this.jsonRequest<any>('/api/v1/portal/games/' + encodeURIComponent(gameId), { method: 'GET' });
            eventBus.emit('db:loaded', { id: gameId, data });
            return data;
        } catch (error) {
            console.error("Database Load Error:", error);
            eventBus.emit('db:error', { operation: 'load', error });
            throw error;
        }
    }

    public async listGames(): Promise<any[]> {
        try {
            const games = await this.jsonRequest<any[]>('/api/v1/portal/games', { method: 'GET' });
            return games || [];
        } catch (error) {
            console.error("Database List Error:", error);
            return [];
        }
    }
}

export const persistence = PersistenceManager.getInstance();
