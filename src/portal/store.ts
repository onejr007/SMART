import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './authSlice';
import { GameSlice, createGameSlice } from './gameSlice';

export enum UserRole {
    ADMIN = 'admin',
    CREATOR = 'creator',
    PLAYER = 'player'
}

export interface User {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
}

export interface Game {
    id: string;
    title: string;
    description: string;
    author: string;
    authorId?: string;
    createdAt?: string;
    scene?: any[];
}

export const useStore = create<AuthSlice & GameSlice>()(
    persist(
        (...a) => ({
            ...createAuthSlice(...a),
            ...createGameSlice(...a),
        }),
        {
            name: 'smart-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
);
