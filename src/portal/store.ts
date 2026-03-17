import { create } from 'zustand';

export enum UserRole {
    ADMIN = 'admin',
    CREATOR = 'creator',
    PLAYER = 'player'
}

interface User {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
}

interface Game {
    id: string;
    title: string;
    description: string;
    author: string;
    authorId?: string;
    createdAt?: string;
    scene?: any[];
}

interface AppState {
    user: User | null;
    loading: boolean;
    games: Game[];
    currentGame: Game | null;
    
    // Auth Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    
    // Game Actions
    setGames: (games: Game[]) => void;
    setCurrentGame: (game: Game | null) => void;
    
    // Optimization #40: Prefetching Strategy
    prefetchGame: (gameId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    user: null,
    loading: true,
    games: [],
    currentGame: null,

    setUser: (user) => {
        set({ user });
        if (user) {
            localStorage.setItem('smart_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('smart_user');
        }
    },

    setLoading: (loading) => set({ loading }),

    logout: () => {
        set({ user: null });
        localStorage.removeItem('smart_user');
    },

    setGames: (games) => set({ games }),

    setCurrentGame: (game) => set({ currentGame: game }),

    prefetchGame: async (gameId) => {
        // Optimization #40: Prefetching Strategy
        // If game is already in currentGames or already fetched, skip
        const { games } = get();
        const existingGame = games.find(g => g.id === gameId);
        
        if (existingGame && existingGame.scene) return;

        try {
            const response = await fetch(`/api/v1/portal/games/${encodeURIComponent(gameId)}`, { credentials: 'include' });
            const payload = await response.json().catch(() => null);
            
            if (response.ok && payload) {
                const updatedGames = games.map(g => 
                    g.id === gameId ? { ...g, ...payload } : g
                );
                set({ games: updatedGames });
            }
        } catch (error) {
            console.error('Failed to prefetch game:', error);
        }
    }
}));
