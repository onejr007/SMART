
import { StateCreator } from 'zustand';
import { User, UserRole } from './store';
import { auth, database } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { ref, set as dbSet, get as dbGet } from 'firebase/database';

export interface AuthSlice {
    user: User | null;
    loading: boolean;
    signup: (email: string, password: string, displayName: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    signup: async (email, password, displayName) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            await updateProfile(firebaseUser, { displayName });

            const userRef = ref(database, `users/${firebaseUser.uid}`);
            const newUser: User = {
                uid: firebaseUser.uid,
                email,
                displayName,
                role: UserRole.PLAYER
            };
            await dbSet(userRef, { ...newUser, createdAt: new Date().toISOString() });

            set({ user: newUser });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create user');
        }
    },
    login: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            const userRef = ref(database, `users/${firebaseUser.uid}`);
            const snapshot = await dbGet(userRef);
            const userData = snapshot.val();

            if (!userData) {
                throw new Error('User data not found');
            }

            set({ user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || userData.displayName || '',
                role: (userData.role as UserRole) || UserRole.PLAYER
            }});
        } catch (error: any) {
            throw new Error(error.message || 'Login failed');
        }
    },
    logout: async () => {
        await signOut(auth);
        set({ user: null });
    }
});
