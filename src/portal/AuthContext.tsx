import React, { createContext, useContext, useEffect } from 'react';
import { useStore, UserRole } from './store';
import { auth, database } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

interface User {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signup: (email: string, password: string, displayName: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading, setUser, setLoading, logout: storeLogout } = useStore();

    useEffect(() => {
        // Listen to Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in, get additional data from database
                const userRef = ref(database, `users/${firebaseUser.uid}`);
                const snapshot = await get(userRef);
                const userData = snapshot.val();
                
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || userData?.displayName || '',
                    role: (userData?.role as UserRole) || UserRole.PLAYER
                });
            } else {
                // User is signed out
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser, setLoading]);

    const signup = async (email: string, password: string, displayName: string) => {
        try {
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Update display name
            await updateProfile(firebaseUser, { displayName });

            // Save user data to Realtime Database
            const userRef = ref(database, `users/${firebaseUser.uid}`);
            await set(userRef, {
                uid: firebaseUser.uid,
                email: email,
                displayName: displayName,
                role: UserRole.PLAYER,
                createdAt: new Date().toISOString()
            });

            setUser({
                uid: firebaseUser.uid,
                email: email,
                displayName: displayName,
                role: UserRole.PLAYER
            });
        } catch (error: any) {
            throw new Error(error.message || 'Failed to create user');
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Get user data from database
            const userRef = ref(database, `users/${firebaseUser.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();

            if (!userData) {
                throw new Error('User data not found');
            }

            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || userData.displayName || '',
                role: (userData.role as UserRole) || UserRole.PLAYER
            });
        } catch (error: any) {
            throw new Error(error.message || 'Login failed');
        }
    };

    const logout = async () => {
        await signOut(auth);
        storeLogout();
    };

    const value = {
        user,
        loading,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
