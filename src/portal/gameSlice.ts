
import { StateCreator } from 'zustand';
import { Game } from './store';
import { persistence } from '../engine/PersistenceManager';

export interface GameSlice {
    games: Game[];
    currentGame: Game | null;
    setGames: (games: Game[]) => void;
    setCurrentGame: (game: Game | null) => void;
    prefetchGame: (gameId: string) => Promise<void>;
}

export const createGameSlice: StateCreator<GameSlice> = (set, get) => ({
    games: [],
    currentGame: null,
    setGames: (games) => set({ games }),
    setCurrentGame: (game) => set({ currentGame: game }),
    prefetchGame: async (gameId) => {
        const { games } = get();
        const existingGame = games.find(g => g.id === gameId);

        if (existingGame && existingGame.scene) return;
        if (!existingGame?.authorId) return;

        try {
            const gameData = await persistence.loadGame(gameId, { silent: true });
            const updatedGames = games.map(g => g.id === gameId ? { ...g, ...gameData } : g);
            set({ games: updatedGames });
        } catch {
        }
    }
});
