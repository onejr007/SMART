import React, { createContext, useContext, useEffect } from 'react';
import { useStore, UserRole } from './store';

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
    // Optimization #45: Global State Optimization (Zustand)
    const { user, loading, setUser, setLoading, logout: storeLogout } = useStore();

    useEffect(() => {
        // Check localStorage untuk auto-login
        const savedUser = localStorage.getItem('smart_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('smart_user');
            }
        }
        setLoading(false);
    }, [setUser, setLoading]);

    const normalizeUser = (raw: any): User => {
        const roleValues = Object.values(UserRole) as string[];
        const role = roleValues.includes(raw?.role) ? (raw.role as UserRole) : UserRole.PLAYER;
        return {
            uid: String(raw?.uid || ''),
            email: String(raw?.email || ''),
            displayName: String(raw?.displayName || ''),
            role
        };
    };

    const signup = async (email: string, password: string, displayName: string) => {
        const res = await fetch('/api/v1/portal/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password, displayName })
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
            throw new Error(data?.error || 'Failed to create user');
        }

        setUser(normalizeUser(data.user));
    };

    const login = async (email: string, password: string) => {
        const res = await fetch('/api/v1/portal/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            throw new Error(data?.error || 'Login failed');
        }
        setUser(normalizeUser(data.user));
    };

    const logout = async () => {
        await fetch('/api/v1/portal/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
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
